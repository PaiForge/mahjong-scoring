import { describe, expect, it } from "vitest";

import {
  checkoutSessionOutcome,
  checkoutSessionParams,
} from "../checkout-session";

describe("checkoutSessionParams", () => {
  const attempt = {
    id: "checkout-1",
    stripePriceId: "price_pass",
    expiresAt: new Date("2026-10-04T13:00:00.750Z"),
    origin: "https://example.com",
  };

  it("予約に固定した Price・期限・戻り先で組む", () => {
    expect(checkoutSessionParams(attempt, "cus_1")).toEqual({
      customer: "cus_1",
      mode: "payment",
      line_items: [{ price: "price_pass", quantity: 1 }],
      allowed_payment_method_types: ["card"],
      locale: "ja",
      expires_at: Math.floor(attempt.expiresAt.getTime() / 1000),
      success_url:
        "https://example.com/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://example.com/plan",
      metadata: { billingCheckoutId: "checkout-1" },
    });
  });
});

describe("checkoutSessionOutcome", () => {
  const open = {
    status: "open",
    url: "https://checkout.stripe.com/x",
  } as const;

  it("失効した Session は売り方に関わらず expired", () => {
    expect(
      checkoutSessionOutcome(
        { status: "expired", url: null },
        { offer: "lifetime" },
        "pass",
      ),
    ).toEqual({ kind: "expired" });
  });

  it("支払い済みの Session は売り方が違っても completed", () => {
    expect(
      checkoutSessionOutcome(
        { status: "complete", url: null },
        { offer: "lifetime" },
        "pass",
      ),
    ).toEqual({ kind: "completed" });
  });

  it("開いている Session の売り方が違えば inProgress", () => {
    expect(checkoutSessionOutcome(open, { offer: "lifetime" }, "pass")).toEqual(
      { kind: "inProgress" },
    );
  });

  it("同じ売り方で開いていれば URL へ送る", () => {
    expect(checkoutSessionOutcome(open, { offer: "pass" }, "pass")).toEqual({
      kind: "redirect",
      url: "https://checkout.stripe.com/x",
    });
  });

  it("開いているのに URL が無ければ missingUrl", () => {
    expect(
      checkoutSessionOutcome(
        { status: "open", url: null },
        { offer: "pass" },
        "pass",
      ),
    ).toEqual({ kind: "missingUrl" });
  });
});
