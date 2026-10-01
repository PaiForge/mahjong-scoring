import { describe, expect, it } from "vitest";

import type { Purchase } from "@/lib/db";

import { formatPlanDate, planStatusOf, purchaseStateOf } from "../plan-status";

const NOW = new Date("2026-10-01T03:00:00Z");

function purchase(overrides: Partial<Purchase>): Purchase {
  return {
    id: "p",
    userId: "u",
    plan: "pro",
    kind: "pass",
    benefits: ["unlimited_practice"],
    stripeCheckoutSessionId: "cs",
    stripePaymentIntentId: "pi",
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

describe("purchaseStateOf", () => {
  it("取り消し済みは refunded（期限や種類より優先）", () => {
    expect(
      purchaseStateOf(
        purchase({
          revokedAt: NOW,
          revokeReason: "refunded",
          kind: "lifetime",
        }),
        NOW,
      ),
    ).toBe("refunded");
  });

  it("買い切りは常に active", () => {
    expect(
      purchaseStateOf(purchase({ kind: "lifetime", expiresAt: null }), NOW),
    ).toBe("active");
  });

  it("パスは期限で expired、開始前なら scheduled、それ以外は active", () => {
    expect(
      purchaseStateOf(
        purchase({ expiresAt: new Date("2026-09-30T00:00:00Z") }),
        NOW,
      ),
    ).toBe("expired");
    expect(
      purchaseStateOf(
        purchase({
          startsAt: new Date("2026-10-20T00:00:00Z"),
          expiresAt: new Date("2026-11-19T00:00:00Z"),
        }),
        NOW,
      ),
    ).toBe("scheduled");
    expect(purchaseStateOf(purchase({}), NOW)).toBe("active");
  });

  it("期限ちょうどは expired", () => {
    expect(purchaseStateOf(purchase({ expiresAt: NOW }), NOW)).toBe("expired");
  });
});

describe("planStatusOf", () => {
  it("購入が無ければ free", () => {
    expect(planStatusOf([], NOW)).toEqual({ kind: "free" });
  });

  it("有効な買い切りがあれば lifetime（パスより優先）", () => {
    expect(
      planStatusOf(
        [purchase({}), purchase({ kind: "lifetime", expiresAt: null })],
        NOW,
      ),
    ).toEqual({ kind: "lifetime" });
  });

  it("取り消された買い切りは無視する", () => {
    expect(
      planStatusOf(
        [
          purchase({
            kind: "lifetime",
            expiresAt: null,
            revokedAt: NOW,
            revokeReason: "refunded",
          }),
        ],
        NOW,
      ),
    ).toEqual({ kind: "free" });
  });

  it("パスは（開始待ちも含めて）最後の期限を until にする", () => {
    const later = new Date("2026-11-19T00:00:00Z");
    expect(
      planStatusOf(
        [
          purchase({}),
          purchase({
            startsAt: new Date("2026-10-20T00:00:00Z"),
            expiresAt: later,
          }),
        ],
        NOW,
      ),
    ).toEqual({ kind: "pass", until: later });
  });

  it("期限切れのパスしか無ければ free", () => {
    expect(
      planStatusOf(
        [purchase({ expiresAt: new Date("2026-09-30T00:00:00Z") })],
        NOW,
      ),
    ).toEqual({ kind: "free" });
  });
});

describe("formatPlanDate", () => {
  it("JST の年月日で出す（UTC 15:00 以降は翌日）", () => {
    expect(formatPlanDate(new Date("2026-10-20T15:00:00Z"))).toBe(
      "2026年10月21日",
    );
  });
});
