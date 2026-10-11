import { isMobilePlanErrorCode } from "@mahjong-scoring/features/billing/mobile-api";
import type { MobileAppleTransactionResponse } from "@mahjong-scoring/features/billing/mobile-api";

import type { PlanApiResult } from "./plan-api";

/**
 * 取引をサーバーへ送った応答から、取引を完了（finish）するかを決める
 * 取引完了の判定
 *
 * - 記録した・記録済み（2xx）→ 完了する
 * - プランの API 固有の理由（4xx。ユーザー名が無い・別のアカウントの取引・
 *   署名が通らない・知らない商品・Sandbox を受け付けない）→ 完了する。送り直しても
 *   通らず、完了しないと StoreKit が起動のたびに同じ取引を配り直し、同じ要求を
 *   永久に送り続ける
 * - サーバーが要求を受け付けない 4xx（`rejected`）→ 完了する。送り直しても同じ
 *   400 が返り、完了しないと起動のたびに送り続ける
 * - サーバーが検証できない（503 `appleUnavailable`）・通信の失敗・一時的な障害・
 *   ログインの失効や切り替え・形の分からない応答 → 完了しない。次の起動で
 *   StoreKit が配り直し、そのとき送り直す
 *
 * 分からない失敗を「完了しない」に倒すのは、完了した取引は StoreKit が二度と
 * 配らず、記録し損ねた購入を取り戻せないため（送り直しの方が安い）。
 */
export function shouldFinishAfter(
  result: PlanApiResult<MobileAppleTransactionResponse>,
): boolean {
  if ("value" in result) return true;
  if (result.error === "rejected") return true;
  return (
    isMobilePlanErrorCode(result.error) && result.error !== "appleUnavailable"
  );
}

/**
 * 購入の復元の結果（画面が出す 1 つの知らせ）
 * 復元結果
 *
 * - `ownedByAnotherAccount` — 別のアカウントに記録された取引があった
 * - `restored` — 1 件以上を新しく記録した
 * - `failed` — 送れなかった取引があった（通信・一時的な障害）。送り直せば通るかもしれない
 * - `nothingToRestore` — 端末に購入が無い、またはすべて記録済み（その他の 4xx を含む）
 */
export type RestoreSummary =
  "ownedByAnotherAccount" | "restored" | "failed" | "nothingToRestore";

/**
 * 復元で送った取引それぞれの応答を、出す知らせ 1 つにまとめる
 * 復元結果の集約
 *
 * 別のアカウントの取引を最優先にする — 本人が別のアカウントで買った Pro を
 * 探しているなら、それが次の行動（ログインし直す）を決める知らせだから。
 * 次に新しく記録できたこと、その次に送れなかったことを知らせる。
 */
export function summarizeRestore(
  results: readonly PlanApiResult<MobileAppleTransactionResponse>[],
): RestoreSummary {
  if (
    results.some(
      (result) => "error" in result && result.error === "ownedByAnotherAccount",
    )
  )
    return "ownedByAnotherAccount";
  if (
    results.some(
      (result) => "value" in result && result.value.outcome === "recorded",
    )
  )
    return "restored";
  if (results.some((result) => !shouldFinishAfter(result))) return "failed";
  return "nothingToRestore";
}
