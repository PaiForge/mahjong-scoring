import type { PlanBenefit } from "../billing/plans";
import type { BeginPracticeQuestionResult } from "./answer";

/**
 * 直近の出題許可の結果
 * 出題ゲート
 *
 * - `open` — 直前の問題は許可された。`remaining` は今日の残り（無制限は `"unlimited"`）
 * - `blocked` — 無料枠を使い切った。問題は生成していない
 * - `unverified` — 通信失敗で出題だけ許可。残数不明・特典なし
 * - `rateLimited` — レート制限に掛かった（連打・自動化）。問題は生成していない
 */
export type PracticeQuotaGate =
  | {
      readonly kind: "open";
      readonly remaining: number | "unlimited";
      readonly limit: number | "unlimited";
      readonly benefits: readonly PlanBenefit[];
    }
  | {
      readonly kind: "blocked";
      readonly limit: number;
      readonly signedIn: boolean;
      readonly benefits: readonly PlanBenefit[];
    }
  | { readonly kind: "rateLimited" }
  | { readonly kind: "unverified" };

/**
 * 出題許可の問い合わせの結果
 * 出題許可問い合わせ結果
 *
 * - `answer` — 規則どおりの答え
 * - `rateLimited` — レート制限（止める）
 * - `unverified` — 確かめられなかった（出題だけ許可して通す）
 *
 * 問い合わせ先（web の Server Action・アプリの API と端末の数え方）の違いは
 * 呼び出し側がこの形に畳んでから {@link PracticeQuotaGate} に写す。
 */
export type QuotaOutcome =
  | { readonly kind: "answer"; readonly answer: BeginPracticeQuestionResult }
  | { readonly kind: "rateLimited" }
  | { readonly kind: "unverified" };

/** 練習 1 つぶんのゲートの状態 */
export interface MenuQuotaState {
  readonly gate: PracticeQuotaGate | undefined;
  /** サーバーの返事を待っている間 true */
  readonly isChecking: boolean;
}
