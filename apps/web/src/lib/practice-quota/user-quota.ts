import "server-only";

import { getActiveBenefits } from "@/lib/entitlements/has-benefit";
import { logExternalError } from "@/lib/log-error";
import { jstDayKey } from "@mahjong-scoring/features/jst";
import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";

import { consumeUserQuota } from "./consume-user-quota";
import {
  failOpenUsage,
  peekUsage,
  quotaAnswer,
  type BeginPracticeQuestionResult,
  type QuotaAudience,
  type QuotaUsage,
} from "@mahjong-scoring/features/quota/answer";
import { readUserQuotaUsage } from "./read-user-quota";

/**
 * ログイン済みユーザーの回数制限 — web の Server Action とアプリ向け API で共有する
 * ログイン済みの回数制限
 *
 * web（`beginPracticeQuestion` / `peekPracticeQuota`）とアプリ（`/api/mobile/v1/
 * practice-quota`）は同じ表（`practice_quota_usage`）・同じ規則・同じ JST の
 * 日付境界で数える。web とアプリで 1 日の枠は 1 つで、片方で使った分はもう片方の
 * 残りから減る。
 *
 * 経路ごとに分かれるのは「販売中か」（`proOnSale`）だけ。web は Stripe の
 * Price ID（`isPlanOnSale("pro")`）、アプリは「App Store か Google Play の
 * どちらかで販売中」（`isAppleIapOnSale() || isGoogleIapOnSale()`）を渡す —
 * 制限を掛ける根拠は「その経路で Pro を買えるか」だから（払う手段が無い
 * ペイウォールを出さない）。アプリは要求の OS を読まずに 2 つのストアをまとめて
 * 判定する。申告した OS で答えが変わると「android と名乗れば数えない」経路が
 * できるため。自分の OS のストアで売っていない端末に払えないペイウォールを
 * 出さないのは、端末が自分の経路の販売中の商品が空ならアプリ向けの回数制限の
 * API を呼ばないことで防ぐ。web とアプリの片方だけ設定した期間は、同じ
 * アカウントの扱いが経路で割れるが、それは受け入れる。
 */

/** 答えの宛先を読む。特典の判定は失敗すると特典なしに倒れる（fail-closed） */
async function readUserAudience(
  userId: string,
  now: Date,
): Promise<QuotaAudience> {
  return {
    signedIn: true,
    benefits: [...(await getActiveBenefits(userId, now))],
  };
}

/**
 * ログイン済みユーザーの無料枠を 1 つ消費して、1 問始めてよいかを答える
 * 出題開始（ログイン済み）
 *
 * Pro（`unlimited_practice`）か販売していない間は消費せず無制限で通す。
 *
 * @design DB の失敗は許可して通す
 *
 * 特典の判定は失敗すると特典なしに倒れる（fail-closed）が、回数の消費が
 * 失敗したときは許可する。練習が止まる方が、無料枠を 1 問多く使われるより
 * 損が大きい。ログは残す。この非対称は意図したもの。
 *
 * @param proOnSale - 呼び出した経路で Pro を販売しているか
 */
export async function beginUserQuota(
  userId: string,
  menu: QuotaMenu,
  now: Date,
  proOnSale: boolean,
): Promise<BeginPracticeQuestionResult> {
  const audience = await readUserAudience(userId, now);
  return quotaAnswer(proOnSale, audience, menu, (limit) =>
    consumeOrFailOpen(userId, menu, now, limit),
  );
}

/**
 * ログイン済みユーザーの今日の残りと特典を、消費せずに読む
 * 残数問い合わせ（ログイン済み）
 *
 * {@link beginUserQuota} と同じ形で返すが、何も増やさない。`allowed` は
 * 「次の 1 問を始められるか」（残りが 0 なら false）。DB の失敗はそのまま
 * 投げる（止める・通すの判断が要らない。呼び出し側は直前の表示を保てばよい）。
 *
 * @param proOnSale - 呼び出した経路で Pro を販売しているか
 */
export async function peekUserQuota(
  userId: string,
  menu: QuotaMenu,
  now: Date,
  proOnSale: boolean,
): Promise<BeginPracticeQuestionResult> {
  const audience = await readUserAudience(userId, now);
  return quotaAnswer(proOnSale, audience, menu, async (limit) =>
    peekUsage(limit, await readUserQuotaUsage(userId, menu, jstDayKey(now))),
  );
}

async function consumeOrFailOpen(
  userId: string,
  menu: QuotaMenu,
  now: Date,
  limit: number,
): Promise<QuotaUsage> {
  try {
    return await consumeUserQuota(userId, menu, jstDayKey(now), limit);
  } catch (error) {
    logExternalError(
      "beginUserQuota",
      "failed to consume quota; allowing the question",
      error,
    );
    return failOpenUsage(limit);
  }
}
