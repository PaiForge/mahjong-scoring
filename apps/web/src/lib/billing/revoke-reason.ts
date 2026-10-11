/**
 * 購入取消理由。返金は全額のみ。
 *
 * 購入の記録（`purchases.ts`）と通知のメタデータ（`notifications/metadata.ts`）の
 * 両方が読むため、どちらにも依存しない葉のモジュールに置く。
 */
export const PurchaseRevokeReason = {
  Refunded: "refunded",
  Fraud: "fraud",
  /**
   * App Store の REVOKE 通知（Family Sharing の解除など、返金ではない取り消し）。
   * Family Sharing は両商品とも OFF にしているので、実運用ではほぼ届かない
   */
  Revoked: "revoked",
} as const;
export type PurchaseRevokeReason =
  (typeof PurchaseRevokeReason)[keyof typeof PurchaseRevokeReason];
