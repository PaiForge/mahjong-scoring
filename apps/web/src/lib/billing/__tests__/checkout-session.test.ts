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
    locale: "ja",
  };

  // 日本語の Session のパラメータは英語対応の前と同じ。唯一の違いは
  // success_url の `&locale=ja` — 予約の言語を言語で分岐せずそのまま載せ、
  // 完了の着地（未ログインの分岐は DB を読む前にある）へ言語を運ぶため。
  // 着地は `locale` が無ければ日本語に倒すので、付く前の URL も同じ所へ着く
  it("予約に固定した Price・期限・戻り先・言語で組む（日本語）", () => {
    expect(checkoutSessionParams(attempt, "cus_1")).toEqual({
      customer: "cus_1",
      mode: "payment",
      line_items: [{ price: "price_pass", quantity: 1 }],
      allowed_payment_method_types: ["card"],
      locale: "ja",
      expires_at: Math.floor(attempt.expiresAt.getTime() / 1000),
      success_url:
        "https://example.com/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}&locale=ja",
      cancel_url: "https://example.com/plan",
      metadata: { billingCheckoutId: "checkout-1" },
    });
  });

  it("英語の予約は Checkout の UI を英語にし、英語の料金ページと着地へ戻す", () => {
    const params = checkoutSessionParams({ ...attempt, locale: "en" }, "cus_1");
    expect(params.locale).toBe("en");
    expect(params.cancel_url).toBe("https://example.com/en/plan");
    expect(params.success_url).toBe(
      "https://example.com/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}&locale=en",
    );
  });

  it("対応言語でない保存値は日本語として組む（列は varchar で型が守らない）", () => {
    const params = checkoutSessionParams({ ...attempt, locale: "fr" }, "cus_1");
    expect(params.locale).toBe("ja");
    expect(params.cancel_url).toBe("https://example.com/plan");
    expect(params.success_url).toBe(
      "https://example.com/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}&locale=ja",
    );
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

  it("開いている Session の売り方が違えば otherOffer", () => {
    expect(checkoutSessionOutcome(open, { offer: "lifetime" }, "pass")).toEqual(
      { kind: "otherOffer" },
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
