/**
 * 購入・特典付与の行のテスト用ファクトリ
 * 購入・付与の行フィクスチャ
 *
 * 全列を埋めた 1 行を返す。既定は「Stripe の 30 日パス（利用者 `u`・2026-09-20 開始・
 * 480 円）」と「期限なしの管理者付与（2026-09-25 開始）」。判定が日付や利用者に
 * 依るテストは、依存する値を overrides で明示して渡す（既定に頼らない）。
 *
 * このモジュールはテスト専用。アプリ本体から import しないこと。
 */
import type { BenefitGrant, Purchase } from "@/lib/db";

export function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: "p",
    userId: "u",
    plan: "pro",
    kind: "pass",
    benefits: ["unlimited_practice"],
    provider: "stripe",
    stripeCheckoutSessionId: "cs",
    stripePaymentIntentId: "pi",
    appleTransactionId: null,
    appleOriginalTransactionId: null,
    appleProductId: null,
    appleEnvironment: null,
    googlePurchaseToken: null,
    googleOrderId: null,
    googleProductId: null,
    googleEnvironment: null,
    currency: "jpy",
    amount: 480,
    startsAt: new Date("2026-09-20T00:00:00Z"),
    expiresAt: new Date("2026-10-20T00:00:00Z"),
    revokedAt: null,
    revokeReason: null,
    createdAt: new Date("2026-09-20T00:00:00Z"),
    ...overrides,
  };
}

export function makeGrant(overrides: Partial<BenefitGrant> = {}): BenefitGrant {
  return {
    id: "g",
    userId: "u",
    plan: "pro",
    benefits: ["unlimited_practice"],
    reason: "モニター",
    category: null,
    grantedBy: "admin",
    startsAt: new Date("2026-09-25T00:00:00Z"),
    expiresAt: null,
    revokedAt: null,
    revokeReason: null,
    createdAt: new Date("2026-09-25T00:00:00Z"),
    ...overrides,
  };
}
