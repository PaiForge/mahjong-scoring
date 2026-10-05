import { describe, expect, it } from "vitest";

import {
  amazonProductUrl,
  extractAsin,
  isValidTrackingId,
  resolveAdHref,
} from "../amazon";

describe("amazonProductUrl", () => {
  it("商品ページの短い URL にトラッキング ID を付ける", () => {
    expect(amazonProductUrl("B08721VWS5", "example-22")).toBe(
      "https://www.amazon.co.jp/dp/B08721VWS5?tag=example-22",
    );
  });
});

describe("extractAsin", () => {
  it.each([
    ["B08721VWS5", "B08721VWS5"],
    ["b08721vws5", "B08721VWS5"],
    [
      "https://www.amazon.co.jp/%E3%82%A6%E3%82%B6%E3%82%AF/dp/B08721VWS5/ref=tmm_kin_swatch_0?_encoding=UTF8&qid=1",
      "B08721VWS5",
    ],
    ["https://www.amazon.co.jp/dp/4839985014?tag=x-22", "4839985014"],
    ["https://www.amazon.co.jp/gp/product/B0DGTQXJ9X", "B0DGTQXJ9X"],
  ])("%s → %s", (input, asin) => {
    expect(extractAsin(input)).toBe(asin);
  });

  it.each(["", "https://www.amazon.co.jp/s?k=麻雀", "B0872"])(
    "読めなければ undefined: %s",
    (input) => {
      expect(extractAsin(input)).toBeUndefined();
    },
  );
});

describe("isValidTrackingId", () => {
  it.each(["example-22", "mahjong0a-22"])("通す: %s", (id) => {
    expect(isValidTrackingId(id)).toBe(true);
  });

  it.each(["", "example", "example-20", "a&b=c-22", "Example-22"])(
    "弾く: %s",
    (id) => {
      expect(isValidTrackingId(id)).toBe(false);
    },
  );
});

describe("resolveAdHref", () => {
  it("URL を持つ広告はトラッキング ID によらずその URL", () => {
    expect(
      resolveAdHref({ href: "https://example.org/x", asin: null }, undefined),
    ).toBe("https://example.org/x");
  });

  it("ASIN の広告はトラッキング ID と組み立て、未設定なら出さない", () => {
    const link = { href: null, asin: "B08721VWS5" };
    expect(resolveAdHref(link, "example-22")).toBe(
      "https://www.amazon.co.jp/dp/B08721VWS5?tag=example-22",
    );
    expect(resolveAdHref(link, undefined)).toBeUndefined();
  });
});
