"use server";

import type { ActionResult } from "@/lib/action-types";
import { getOptionalUser } from "@/lib/auth";
import { isPlanOnSale } from "@/lib/billing/env";
import { getActiveBenefits } from "@/lib/entitlements/has-benefit";
import { logExternalError } from "@/lib/log-error";
import {
  canSignAnonymousQuota,
  readAnonymousQuota,
  writeAnonymousQuota,
} from "@/lib/practice-quota/anonymous-quota-cookie";
import { consumeUserQuota } from "@/lib/practice-quota/consume-user-quota";
import {
  consumeUsage,
  isUnlimited,
  peekUsage,
  unlimitedAnswer,
  type BeginPracticeQuestionResult,
  type QuotaAudience,
} from "@/lib/practice-quota/quota-answer";
import { jstDayKey } from "@mahjong-scoring/features/jst";
import { readUserQuotaUsage } from "@/lib/practice-quota/read-user-quota";
import {
  PRACTICE_QUOTA_LIMITS,
  isQuotaMenu,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";
import {
  enforceIpRateLimit,
  type RateLimitErrorCode,
} from "@/lib/rate-limit-ip";

export type { BeginPracticeQuestionResult };

/** 不正な練習名で呼ばれたときのエラー。UI のバグなので i18n キーは持たない */
export type BeginPracticeQuestionError = RateLimitErrorCode | "invalidMenu";

/**
 * エンドレス練習で 1 問生成する直前に呼び、無料枠を 1 つ消費する
 * 出題開始
 *
 * 問題の生成はブラウザ側のまま。サーバーは「始めてよいか」を数えるだけで、
 * 問題の内容には関わらない。
 *
 * - Pro（`unlimited_practice`）は消費せず常に許可
 * - ログイン済みの無料ユーザーは DB（`practice_quota_usage`）で数える。回避不能
 * - 未ログインは署名付き cookie で数える。cookie を消せば戻る弱い制限（決定どおり）
 * - Pro を販売していない間（Price ID 未設定。`isPlanOnSale`）は誰にも制限を
 *   掛けない。払う手段が無いペイウォールを出さないため。特典は本物の判定
 *   どおり返す（拡張機能の出し分けは販売の有無と無関係）
 *
 * @design DB の失敗は許可して通す
 *
 * 特典の判定（`getActiveBenefits`）は失敗すると特典なしに倒れる（fail-closed）が、
 * 回数の消費が失敗したときは許可する。練習が止まる方が、無料枠を 1 問多く
 * 使われるより損が大きい。ログは残す。この非対称は意図したもの。
 */
export async function beginPracticeQuestion(
  menu: string,
): Promise<
  ActionResult<BeginPracticeQuestionError, BeginPracticeQuestionResult>
> {
  if (!isQuotaMenu(menu)) return { error: "invalidMenu" };

  const rateLimited = await enforceIpRateLimit("beginPracticeQuestion");
  if (rateLimited) return rateLimited;

  const now = new Date();
  const user = await getOptionalUser();
  const audience = await readAudience(user?.id, now);

  if (isUnlimited(isPlanOnSale("pro"), audience.benefits)) {
    return { success: true, ...unlimitedAnswer(audience) };
  }

  if (user) {
    return {
      success: true,
      ...(await beginForUser(user.id, menu, now, audience)),
    };
  }
  return { success: true, ...(await beginForAnonymous(menu, now)) };
}

/**
 * 今日の残りと特典を消費せずに読む
 * 残数問い合わせ
 *
 * 盤面を離れて戻ってきたとき（料金ページを見てブラウザバック等）、
 * ストアに残った解答中の問題を引き継ぎながら、残数・特典の表示だけを
 * 取り直すために呼ぶ。`beginPracticeQuestion` と同じ形で返すが、何も
 * 増やさない。`allowed` は「次の 1 問を始められるか」（残りが 0 なら false）。
 *
 * 離れている間に起きた購入・ログイン・日付の変わり目を表示に反映させる
 * のが目的で、返事が届かなくても盤面は直前の表示を保てばよい。
 * 失敗はそのまま投げる（`beginPracticeQuestion` と違い、止める・通す
 * の判断が要らない）。
 */
export async function peekPracticeQuota(
  menu: string,
): Promise<
  ActionResult<BeginPracticeQuestionError, BeginPracticeQuestionResult>
> {
  if (!isQuotaMenu(menu)) return { error: "invalidMenu" };

  const rateLimited = await enforceIpRateLimit("peekPracticeQuota");
  if (rateLimited) return rateLimited;

  const now = new Date();
  const user = await getOptionalUser();
  const audience = await readAudience(user?.id, now);

  if (isUnlimited(isPlanOnSale("pro"), audience.benefits)) {
    return { success: true, ...unlimitedAnswer(audience) };
  }

  if (user) {
    const { benefits } = audience;
    const limit = PRACTICE_QUOTA_LIMITS[menu].signedIn;
    const used = await readUserQuotaUsage(user.id, menu, jstDayKey(now));
    return {
      success: true,
      ...peekUsage(limit, used),
      limit,
      signedIn: true,
      benefits,
    };
  }

  const limit = PRACTICE_QUOTA_LIMITS[menu].anonymous;
  const base = { success: true, limit, signedIn: false, benefits: [] } as const;
  if (!canSignAnonymousQuota()) {
    return { ...base, allowed: true, remaining: limit };
  }
  const counts = await readAnonymousQuota(now);
  return { ...base, ...peekUsage(limit, counts[menu]) };
}

/**
 * 答えの宛先を読む。特典の判定は失敗すると特典なしに倒れる（fail-closed）
 * （出題開始・残数問い合わせで共通）
 */
async function readAudience(
  userId: string | undefined,
  now: Date,
): Promise<QuotaAudience> {
  if (userId === undefined) return { signedIn: false, benefits: [] };
  return {
    signedIn: true,
    benefits: [...(await getActiveBenefits(userId, now))],
  };
}

async function beginForUser(
  userId: string,
  menu: QuotaMenu,
  now: Date,
  { benefits }: QuotaAudience,
): Promise<BeginPracticeQuestionResult> {
  const limit = PRACTICE_QUOTA_LIMITS[menu].signedIn;
  try {
    const result = await consumeUserQuota(userId, menu, jstDayKey(now), limit);
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      limit,
      signedIn: true,
      benefits,
    };
  } catch (error) {
    logExternalError(
      "beginPracticeQuestion",
      "failed to consume quota; allowing the question",
      error,
    );
    return { allowed: true, remaining: limit, limit, signedIn: true, benefits };
  }
}

async function beginForAnonymous(
  menu: QuotaMenu,
  now: Date,
): Promise<BeginPracticeQuestionResult> {
  const limit = PRACTICE_QUOTA_LIMITS[menu].anonymous;
  const base = { limit, signedIn: false, benefits: [] } as const;

  if (!canSignAnonymousQuota()) {
    logExternalError(
      "beginPracticeQuestion",
      "no signing key for the anonymous quota cookie; allowing the question",
      undefined,
    );
    return { ...base, allowed: true, remaining: limit };
  }

  const counts = await readAnonymousQuota(now);
  const used = counts[menu];
  const usage = consumeUsage(limit, used);
  if (usage.allowed) {
    await writeAnonymousQuota({ ...counts, [menu]: used + 1 }, now);
  }
  return { ...base, ...usage };
}
