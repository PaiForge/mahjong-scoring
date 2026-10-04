/**
 * 購入取消理由。返金は全額のみ。
 *
 * 購入の記録（`purchases.ts`）と通知のメタデータ（`notifications/metadata.ts`）の
 * 両方が読むため、どちらにも依存しない葉のモジュールに置く。
 */
export const PurchaseRevokeReason = {
  Refunded: "refunded",
  Fraud: "fraud",
} as const;
export type PurchaseRevokeReason =
  (typeof PurchaseRevokeReason)[keyof typeof PurchaseRevokeReason];
