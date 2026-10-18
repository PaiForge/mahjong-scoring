import type { MobilePlanResponse } from "@mahjong-scoring/features/billing/mobile-api";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";

import type { FocusReadState } from "../lib/use-focus-read";

/**
 * 設定の Pro の行の出し分け
 * Pro 設定行の状態
 *
 * - `pending` — 特典を読んでいる。保存値のまま押せないスイッチを出す（読み込み中に
 *   鍵の行を出すと、Pro の人にも一瞬鍵が見える）
 * - `granted` — `practice_tools` あり。スイッチを出す
 * - `locked` — 特典なし・読めなかった。鍵の行（プラン画面へ）
 * - `signedOut` — ゲスト。鍵の行（ログインへ）
 */
export type PracticeToolsAccess =
  "pending" | "granted" | "locked" | "signedOut";

/**
 * ログイン中のプランの読み取りから、Pro の行の出し分けを決める
 * Pro 設定行の状態判定
 *
 * 読み直しの間（`loaded` の `pending`）は前に読めた値で決める。行ごとに
 * プランを読まず、設定画面で 1 回読んだ結果を全部の行で共有する。
 *
 * @param plan `usePlan` の状態
 */
export function resolvePracticeToolsAccess(
  plan: FocusReadState<MobilePlanResponse, unknown>,
): Exclude<PracticeToolsAccess, "signedOut"> {
  if (plan.kind === "loading") return "pending";
  if (plan.kind === "failed") return "locked";
  return plan.value.benefits.includes(PlanBenefit.PracticeTools)
    ? "granted"
    : "locked";
}
