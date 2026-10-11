/**
 * 購入履歴 1 行の状態
 * 購入状態
 *
 * - `refunded` — 取り消し済み（返金・不正・App Store の取り消し）
 * - `active` — 開始済みで有効
 * - `scheduled` — 開始待ち（有効な購入の期限から始まるパス）
 * - `expired` — 期限切れ
 *
 * 状態を導く規則（`purchaseStateOf`）は web の `lib/billing/plan-status.ts` が
 * 持つ。語彙だけをここに置くのは、アプリ向け API の応答（`mobile-api.ts`）にも
 * 同じ値が載り、アプリと web で同じ語を使うため。このモジュールは純粋。
 */
export const PurchaseState = {
  Refunded: "refunded",
  Active: "active",
  Scheduled: "scheduled",
  Expired: "expired",
} as const;
export type PurchaseState = (typeof PurchaseState)[keyof typeof PurchaseState];

const PURCHASE_STATE_VALUES: readonly string[] = Object.values(PurchaseState);

/**
 * 文字列が購入状態の値か
 * 購入状態判定
 */
export function isPurchaseState(value: string): value is PurchaseState {
  return PURCHASE_STATE_VALUES.includes(value);
}
