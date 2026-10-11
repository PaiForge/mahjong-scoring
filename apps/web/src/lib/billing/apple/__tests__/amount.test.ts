import { describe, expect, it } from "vitest";

import { appleAmountOf } from "../amount";

describe("appleAmountOf", () => {
  it("JPY は 1/1000 単位から円にする", () => {
    expect(appleAmountOf(980000, "JPY")).toEqual({
      amount: 980,
      currency: "jpy",
    });
  });

  it("USD はセントにする", () => {
    expect(appleAmountOf(9990, "USD")).toEqual({
      amount: 999,
      currency: "usd",
    });
  });

  it("価格も通貨も無ければ 0 円", () => {
    expect(appleAmountOf(undefined, undefined)).toEqual({
      amount: 0,
      currency: "jpy",
    });
  });

  it("通貨の形が違えば jpy", () => {
    expect(appleAmountOf(980000, "JP")).toEqual({
      amount: 980,
      currency: "jpy",
    });
  });
});
