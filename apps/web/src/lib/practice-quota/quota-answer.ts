import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";

/**
 * 練習の無料枠 — 「1 問始めてよいか」の答えを組み立てる規則
 * 出題許可の規則
 *
 * 出題開始（`beginPracticeQuestion`）と残数問い合わせ（`peekPracticeQuota`）が
 * 同じ規則で答えるための純粋な関数を集める。両者が食い違うと、残数の表示と
 * 実際に始められるかがずれる。DB・cookie・特典の読み出しと、失敗したときに
 * 止めるか通すかの判断は呼び出し側（Server Action）が持つ。
 */

/**
 * 1 問始めてよいかの答え
 * 出題許可
 *
 * - `allowed` — 問題を生成してよいか。false なら生成せずペイウォールを出す
 * - `remaining` — 今日の残り（この 1 問を含めず）。Pro は `"unlimited"`
 * - `limit` — 1 日の上限。文言「1 日 n 問」に使う。Pro は `"unlimited"`
 * - `signedIn` — ログインしているか。未ログインのペイウォールは先にログインを勧める
 * - `benefits` — 保有する特典。拡張機能の出し分けに使う
 *
 * `interface` ではなく `type` なのは `ActionResult` の `Record<string, unknown>`
 * 制約を満たすため（interface は暗黙のインデックスシグネチャを持たない）。
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- ActionResult の Record<string, unknown> 制約を満たすため（interface は暗黙のインデックスシグネチャを持たない）
export type BeginPracticeQuestionResult = {
  readonly allowed: boolean;
  readonly remaining: number | "unlimited";
  readonly limit: number | "unlimited";
  readonly signedIn: boolean;
  readonly benefits: readonly PlanBenefit[];
};

/** 答えの宛先。未ログインは特典を持たない */
export interface QuotaAudience {
  readonly signedIn: boolean;
  readonly benefits: readonly PlanBenefit[];
}

/**
 * 回数を数えずに無制限で通すか
 *
 * Pro（`unlimited_practice`）を持つか、Pro を販売していない間（払う手段が
 * 無いペイウォールを出さないため）は無制限。
 */
export function isUnlimited(
  proOnSale: boolean,
  benefits: readonly PlanBenefit[],
): boolean {
  return !proOnSale || benefits.includes(PlanBenefit.UnlimitedPractice);
}

/** 無制限の答え。特典は本物の判定どおり返す（拡張機能の出し分けは販売の有無と無関係） */
export function unlimitedAnswer(
  audience: QuotaAudience,
): BeginPracticeQuestionResult {
  return {
    allowed: true,
    remaining: "unlimited",
    limit: "unlimited",
    signedIn: audience.signedIn,
    benefits: audience.benefits,
  };
}

/** 回数の判定結果。答えの `allowed` / `remaining` になる */
export interface QuotaUsage {
  readonly allowed: boolean;
  readonly remaining: number;
}

/**
 * 消費せずに見たときの判定
 *
 * `allowed` は「次の 1 問を始められるか」、`remaining` は今日の残り。
 *
 * @param used - 今日すでに始めた問題数
 */
export function peekUsage(limit: number, used: number): QuotaUsage {
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining };
}

/**
 * 1 問消費したときの判定
 *
 * 上限に達していれば消費せず不許可。許可したときの `remaining` は
 * この 1 問を含めない残り。ログイン済みの消費は並行リクエストで上限を
 * 超えないよう SQL の 1 文で同じ規則を行う（`consumeUserQuota`）ため、
 * これを使うのは cookie で数える未ログインだけ。
 *
 * @param used - 消費前に今日すでに始めた問題数
 */
export function consumeUsage(limit: number, used: number): QuotaUsage {
  if (used >= limit) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: limit - (used + 1) };
}
