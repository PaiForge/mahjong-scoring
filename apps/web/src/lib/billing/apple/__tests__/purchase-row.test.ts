import { describe, expect, it } from "vitest";

import {
  addPassDuration,
  PLANS,
} from "@mahjong-scoring/features/billing/plans";

import { buildApplePurchaseRow } from "../purchase-row";

const PURCHASE_DATE = new Date("2026-10-11T00:00:00Z");
const LATER = new Date("2026-10-20T00:00:00Z");
const LATEST = new Date("2026-10-25T00:00:00Z");

const transaction = {
  transactionId: "tx1",
  originalTransactionId: "otx1",
  productId: "help.mahjong.score.pro.pass30",
  environment: "Production",
  purchaseDate: PURCHASE_DATE,
  price: 480000,
  currency: "JPY",
} as const;

function build(
  overrides: Partial<Parameters<typeof buildApplePurchaseRow>[0]> = {},
) {
  return buildApplePurchaseRow({
    transaction,
    userId: "user-1",
    offer: PLANS.pro.offers.pass,
    unexpiredPurchases: [],
    revocation: undefined,
    ...overrides,
  });
}

describe("buildApplePurchaseRow", () => {
  it("Apple の列・特典・金額を埋める", () => {
    expect(build()).toEqual({
      userId: "user-1",
      provider: "apple",
      plan: "pro",
      kind: "pass",
      benefits: PLANS.pro.benefits,
      appleTransactionId: "tx1",
      appleOriginalTransactionId: "otx1",
      appleProductId: "help.mahjong.score.pro.pass30",
      appleEnvironment: "Production",
      currency: "jpy",
      amount: 480,
      startsAt: PURCHASE_DATE,
      expiresAt: addPassDuration(PURCHASE_DATE, 30),
      revokedAt: null,
      revokeReason: null,
    });
  });

  it("買い切りは購入日時に始まり期限を持たない", () => {
    const row = build({
      offer: PLANS.pro.offers.lifetime,
      unexpiredPurchases: [{ expiresAt: LATER }],
    });
    expect(row.startsAt).toEqual(PURCHASE_DATE);
    expect(row.expiresAt).toBeNull();
  });

  it("有効なパスがあれば、最も遅い期限から始まる開始待ちで入れる", () => {
    const row = build({
      unexpiredPurchases: [{ expiresAt: LATER }, { expiresAt: LATEST }],
    });
    expect(row.startsAt).toEqual(LATEST);
    expect(row.expiresAt).toEqual(addPassDuration(LATEST, 30));
  });

  it("購入日時より前に切れる期限では動かさない", () => {
    const row = build({
      unexpiredPurchases: [{ expiresAt: new Date("2026-10-10T00:00:00Z") }],
    });
    expect(row.startsAt).toEqual(PURCHASE_DATE);
  });

  it("買い切りが有効なら、パスは購入日時から始める", () => {
    const row = build({
      unexpiredPurchases: [{ expiresAt: LATER }, { expiresAt: null }],
    });
    expect(row.startsAt).toEqual(PURCHASE_DATE);
  });

  it("取り消し済みで入れる行は開始待ちにせず、取り消しの日時と理由を持つ", () => {
    const at = new Date("2026-10-12T00:00:00Z");
    const row = build({
      unexpiredPurchases: [{ expiresAt: LATER }],
      revocation: { at, reason: "refunded" },
    });
    expect(row.startsAt).toEqual(PURCHASE_DATE);
    expect(row.expiresAt).toEqual(addPassDuration(PURCHASE_DATE, 30));
    expect(row.revokedAt).toEqual(at);
    expect(row.revokeReason).toBe("refunded");
  });
});
