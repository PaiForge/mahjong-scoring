import type Stripe from "stripe";
import { describe, expect, it } from "vitest";

import {
  isFullyRefunded,
  sessionMatchesCheckout,
} from "../checkout-session-match";

const checkout = {
  stripePriceId: "price_pass",
  stripeCheckoutSessionId: null,
};

function sessionWith(
  items: readonly { priceId: string; quantity: number }[],
  overrides: { id?: string; hasMore?: boolean } = {},
) {
  return {
    id: overrides.id ?? "cs_1",
    line_items: {
      object: "list",
      url: "",
      has_more: overrides.hasMore ?? false,
      data: items.map(({ priceId, quantity }) => ({
        price: { id: priceId },
        quantity,
      })),
    } as unknown as Stripe.ApiList<Stripe.LineItem>,
  };
}

describe("sessionMatchesCheckout", () => {
  it("予約した Price を 1 個だけ買った Session を受け付ける", () => {
    expect(
      sessionMatchesCheckout(
        sessionWith([{ priceId: "price_pass", quantity: 1 }]),
        checkout,
      ),
    ).toBe(true);
  });

  it("Price・数量・行数・続きの有無が予約と違えば弾く", () => {
    const cases = [
      sessionWith([{ priceId: "price_life", quantity: 1 }]),
      sessionWith([{ priceId: "price_pass", quantity: 2 }]),
      sessionWith([
        { priceId: "price_pass", quantity: 1 },
        { priceId: "price_pass", quantity: 1 },
      ]),
      sessionWith([{ priceId: "price_pass", quantity: 1 }], { hasMore: true }),
      sessionWith([]),
      { id: "cs_1", line_items: undefined },
    ];
    for (const session of cases) {
      expect(sessionMatchesCheckout(session, checkout)).toBe(false);
    }
  });

  it("予約に Session ID が保存済みなら、別の Session は弾く", () => {
    const saved = { ...checkout, stripeCheckoutSessionId: "cs_1" };
    const item = [{ priceId: "price_pass", quantity: 1 }];
    expect(sessionMatchesCheckout(sessionWith(item), saved)).toBe(true);
    expect(
      sessionMatchesCheckout(sessionWith(item, { id: "cs_2" }), saved),
    ).toBe(false);
  });
});

describe("isFullyRefunded", () => {
  it("返金額が決済額に達したら全額返金", () => {
    expect(isFullyRefunded({ amount: 480, amount_refunded: 480 })).toBe(true);
    expect(isFullyRefunded({ amount: 480, amount_refunded: 479 })).toBe(false);
  });

  it("0 円の決済は返金済みとみなさない", () => {
    expect(isFullyRefunded({ amount: 0, amount_refunded: 0 })).toBe(false);
  });
});
