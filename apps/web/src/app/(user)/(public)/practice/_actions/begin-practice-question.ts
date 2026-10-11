"use server";

import type { ActionResult } from "@/lib/action-types";
import { getOptionalUser } from "@/lib/auth";
import { isPlanOnSale } from "@/lib/billing/env";
import { logExternalError } from "@/lib/log-error";
import {
  canSignAnonymousQuota,
  readAnonymousQuota,
  writeAnonymousQuota,
} from "@/lib/practice-quota/anonymous-quota-cookie";
import {
  consumeUsage,
  dailyLimit,
  failOpenUsage,
  isUnlimited,
  limitedAnswer,
  peekUsage,
  unlimitedAnswer,
  type BeginPracticeQuestionResult,
  type QuotaAudience,
  type QuotaUsage,
} from "@mahjong-scoring/features/quota/answer";
import { beginUserQuota, peekUserQuota } from "@/lib/practice-quota/user-quota";
import {
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
 * - ログイン済みの無料ユーザーは DB（`practice_quota_usage`）で数える。回避不能。
 *   規則はアプリ向け API と共有する `beginUserQuota`（web とアプリで 1 日の枠は 1 つ）
 * - 未ログインは署名付き cookie で数える。cookie を消せば戻る弱い制限（決定どおり）
 * - Pro を販売していない間（Price ID 未設定。`isPlanOnSale`）は誰にも制限を
 *   掛けない。web の経路の販売の有無を見る（アプリ向け API は App Store の
 *   Product ID の有無を見る）。払う手段が無いペイウォールを出さないため。特典は本物の判定
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
  if (user) {
    return {
      success: true,
      ...(await beginUserQuota(user.id, menu, now, isPlanOnSale("pro"))),
    };
  }

  if (isUnlimited(isPlanOnSale("pro"), ANONYMOUS_AUDIENCE.benefits)) {
    return { success: true, ...unlimitedAnswer(ANONYMOUS_AUDIENCE) };
  }
  const limit = dailyLimit(menu, ANONYMOUS_AUDIENCE);
  const usage = await consumeForAnonymous(menu, now, limit);
  return { success: true, ...limitedAnswer(ANONYMOUS_AUDIENCE, limit, usage) };
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
  if (user) {
    return {
      success: true,
      ...(await peekUserQuota(user.id, menu, now, isPlanOnSale("pro"))),
    };
  }

  if (isUnlimited(isPlanOnSale("pro"), ANONYMOUS_AUDIENCE.benefits)) {
    return { success: true, ...unlimitedAnswer(ANONYMOUS_AUDIENCE) };
  }
  const limit = dailyLimit(menu, ANONYMOUS_AUDIENCE);
  const usage = await peekForAnonymous(menu, now, limit);
  return { success: true, ...limitedAnswer(ANONYMOUS_AUDIENCE, limit, usage) };
}

/** 未ログインの宛先。特典を持たない */
const ANONYMOUS_AUDIENCE: QuotaAudience = { signedIn: false, benefits: [] };

async function peekForAnonymous(
  menu: QuotaMenu,
  now: Date,
  limit: number,
): Promise<QuotaUsage> {
  if (!canSignAnonymousQuota()) return failOpenUsage(limit);
  const counts = await readAnonymousQuota(now);
  return peekUsage(limit, counts[menu]);
}

async function consumeForAnonymous(
  menu: QuotaMenu,
  now: Date,
  limit: number,
): Promise<QuotaUsage> {
  if (!canSignAnonymousQuota()) {
    logExternalError(
      "beginPracticeQuestion",
      "no signing key for the anonymous quota cookie; allowing the question",
      undefined,
    );
    return failOpenUsage(limit);
  }

  const counts = await readAnonymousQuota(now);
  const used = counts[menu];
  const usage = consumeUsage(limit, used);
  if (usage.allowed) {
    await writeAnonymousQuota({ ...counts, [menu]: used + 1 }, now);
  }
  return usage;
}
