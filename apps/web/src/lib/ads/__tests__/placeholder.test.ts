import { describe, expect, it } from "vitest";

import { isPlaceholderAdHref, PLACEHOLDER_AD_HREF } from "../placeholder";

describe("isPlaceholderAdHref", () => {
  it.each([
    PLACEHOLDER_AD_HREF,
    "https://example.com/dp/XXXX",
    "https://www.example.org/",
    "https://shop.example/",
  ])("文書用ホストは仮リンク: %s", (href) => {
    expect(isPlaceholderAdHref(href)).toBe(true);
  });

  it.each([
    "https://www.amazon.co.jp/dp/B08721VWS5?tag=example-22",
    "https://notexample.com/",
    "not a url",
  ])("それ以外は仮リンクではない: %s", (href) => {
    expect(isPlaceholderAdHref(href)).toBe(false);
  });
});
