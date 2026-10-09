import { describe, expect, it } from "vitest";

import { addPassDuration } from "@mahjong-scoring/features/billing/plans";
import { buildPurchaseRow } from "../purchase-row";

const NOW = new Date("2026-10-09T03:00:00Z");
const CHARGE_CREATED = Date.parse("2026-10-09T02:59:00Z") / 1000;

const session = { id: "cs_1", currency: "JPY", amount_total: 500 };
const pass = {
  plan: "pro",
  kind: "pass",
  benefits: ["unlimitedPractice"],
  durationDays: 30,
};

function build(
  overrides: Partial<Parameters<typeof buildPurchaseRow>[0]> = {},
) {
  return buildPurchaseRow({
    session,
    paymentIntentId: "pi_1",
    checkout: pass,
    userId: "user-1",
    chargeCreated: CHARGE_CREATED,
    refunded: false,
    now: NOW,
    ...overrides,
  });
}

describe("buildPurchaseRow", () => {
  it("予約の販売条件で、決済の時刻から始まる行を組む", () => {
    const startsAt = new Date(CHARGE_CREATED * 1000);
    expect(build()).toEqual({
      userId: "user-1",
      plan: "pro",
      kind: "pass",
      benefits: ["unlimitedPractice"],
      stripeCheckoutSessionId: "cs_1",
      stripePaymentIntentId: "pi_1",
      currency: "jpy",
      amount: 500,
      startsAt,
      expiresAt: addPassDuration(startsAt, 30),
      revokedAt: null,
      revokeReason: null,
    });
  });

  it("期間を持たない予約（買い切り）は失効しない", () => {
    expect(
      build({ checkout: { ...pass, kind: "lifetime", durationDays: null } })
        .expiresAt,
    ).toBeNull();
  });

  it("返金済みで入れる行は、入れた時刻で取り消し済みにする", () => {
    const row = build({ refunded: true });
    expect(row.revokedAt).toEqual(NOW);
    expect(row.revokeReason).toBe("refunded");
  });

  it("通貨・金額が無ければ jpy・0 にする", () => {
    const row = build({
      session: { id: "cs_1", currency: null, amount_total: null },
    });
    expect(row.currency).toBe("jpy");
    expect(row.amount).toBe(0);
  });
});
