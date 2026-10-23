import type { RecordPurchaseResult } from "./purchases";

/**
 * Checkout 完了の着地でマイページに付ける状態（`/mypage/plan?status=`）
 * 購入着地状態
 */
export type CheckoutLandingStatus = "success" | "pending" | "failed";

/**
 * 購入記録の結果から、マイページに着地したときの状態を決める
 * 購入着地状態判定
 *
 * - `recorded` — 記録できたので成功を出す
 * - `ignored`（`notPaid`）— 非同期の支払い方法（いまは使わない）で未確定のまま
 *   戻った。結果を待たせる
 * - `ignored`（その他）— 記録できない支払いを成功表示にしない
 * - `refunded` / `duplicate` — 状態を付けず、現在の購入状況（履歴）へ戻す
 */
export function checkoutStatusOf(
  result: RecordPurchaseResult,
): CheckoutLandingStatus | undefined {
  switch (result.outcome) {
    case "recorded":
      return "success";
    case "ignored":
      return result.reason === "notPaid" ? "pending" : "failed";
    case "refunded":
    case "duplicate":
      return undefined;
  }
}
