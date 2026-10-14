import { PlanBenefit } from "../billing/plans";
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

/**
 * 盤面に回答時間を出すか
 * 回答時間表示判定
 *
 * 回答時間の計測は Pro の拡張機能（`PracticeTools`）。設定のフラグだけでなく、
 * サーバーが直前の出題許可で返した特典にも含まれているときだけ出す。和了形・
 * 聴牌形の点数計算の盤面（web とアプリ）が同じ条件を引く。
 *
 * @param measureTime - 設定の「回答時間を計測する」
 * @param gate - 直近の出題許可の結果（問い合わせ前は undefined）
 */
export function showsAnswerTime(
  measureTime: boolean,
  gate: PracticeQuotaGate | undefined,
): boolean {
  return (
    measureTime &&
    gate?.kind === "open" &&
    gate.benefits.includes(PlanBenefit.PracticeTools)
  );
}
