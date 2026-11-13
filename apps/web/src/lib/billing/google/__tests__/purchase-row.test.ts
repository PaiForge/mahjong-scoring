import { describe, expect, it } from "vitest";

import {
  addPassDuration,
  PLANS,
} from "@mahjong-scoring/features/billing/plans";

import { buildGooglePurchaseRow } from "../purchase-row";

const PURCHASE_DATE = new Date("2026-11-14T00:00:00Z");
const LATER = new Date("2026-11-20T00:00:00Z");
const LATEST = new Date("2026-11-25T00:00:00Z");

const purchase = {
  purchaseToken: "token-1",
  orderId: "GPA.1234",
  productId: "help.mahjong.score.pro.pass30",
  environment: "Production",
  purchaseDate: PURCHASE_DATE,
} as const;

function build(
  overrides: Partial<Parameters<typeof buildGooglePurchaseRow>[0]> = {},
) {
  return buildGooglePurchaseRow({
    purchase,
    userId: "user-1",
    offer: PLANS.pro.offers.pass,
    unexpiredPurchases: [],
    ...overrides,
  });
}

describe("buildGooglePurchaseRow", () => {
  it("Google の列・特典を埋め、Play が価格を返さないので金額は 0 / jpy で持つ", () => {
    expect(build()).toEqual({
      userId: "user-1",
      provider: "google",
      plan: "pro",
      kind: "pass",
      benefits: PLANS.pro.benefits,
      googlePurchaseToken: "token-1",
      googleOrderId: "GPA.1234",
      googleProductId: "help.mahjong.score.pro.pass30",
      googleEnvironment: "Production",
      currency: "jpy",
      amount: 0,
      startsAt: PURCHASE_DATE,
      expiresAt: addPassDuration(PURCHASE_DATE, 30),
    });
  });

  it("注文 ID が欠けた購入は NULL で入れる", () => {
    expect(
      build({ purchase: { ...purchase, orderId: undefined } }).googleOrderId,
    ).toBeNull();
  });

  it("買い切りは購入日時に始まり期限を持たない", () => {
    const row = build({
      offer: PLANS.pro.offers.lifetime,
      unexpiredPurchases: [{ expiresAt: LATER }],
    });
    expect(row.startsAt).toEqual(PURCHASE_DATE);
    expect(row.expiresAt).toBeNull();
  });

  it("有効なパスがあれば App Store と同じく最も遅い期限から始まる開始待ちで入れる", () => {
    const row = build({
      unexpiredPurchases: [{ expiresAt: LATER }, { expiresAt: LATEST }],
    });
    expect(row.startsAt).toEqual(LATEST);
    expect(row.expiresAt).toEqual(addPassDuration(LATEST, 30));
  });

  it("有効な買い切りがあればパスは購入日時から始める", () => {
    const row = build({
      unexpiredPurchases: [{ expiresAt: LATER }, { expiresAt: null }],
    });
    expect(row.startsAt).toEqual(PURCHASE_DATE);
  });
});
