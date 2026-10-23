import { describe, expect, it } from "vitest";

import { toNativeAdViews, type ActiveCreative } from "../native-ad-views";

function creative(overrides: Partial<ActiveCreative> = {}): ActiveCreative {
  return {
    id: "c1",
    kind: "native_card",
    href: "https://www.amazon.co.jp/dp/xxx?tag=example-22",
    asin: null,
    icon: "📘",
    imagePath: null,
    imageAlt: null,
    hand: null,
    copy: { title: { ja: "麻雀の本" }, description: { ja: "説明" } },
    ...overrides,
  };
}

describe("toNativeAdViews", () => {
  it("掲載中の広告を画面に渡す形にし、NULL を undefined にする", () => {
    expect(
      toNativeAdViews([creative()], "practice-grid-native-ad", "ja", undefined),
    ).toEqual([
      {
        id: "c1",
        kind: "native_card",
        href: "https://www.amazon.co.jp/dp/xxx?tag=example-22",
        icon: "📘",
        imageUrl: undefined,
        imageAlt: "",
        hand: undefined,
        title: "麻雀の本",
        description: "説明",
      },
    ]);
  });

  it("タイトルが空の行は描画に通さない", () => {
    const untitled = creative({
      copy: { title: { ja: "" }, description: { ja: "説明" } },
    });
    expect(
      toNativeAdViews([untitled], "practice-grid-native-ad", "ja", undefined),
    ).toEqual([]);
  });

  it("ASIN の広告はトラッキング ID が無ければ出さず、あればリンクを組み立てる", () => {
    const byAsin = creative({ href: null, asin: "4000000000" });
    expect(
      toNativeAdViews([byAsin], "practice-grid-native-ad", "ja", undefined),
    ).toEqual([]);
    const [view] = toNativeAdViews(
      [byAsin],
      "practice-grid-native-ad",
      "ja",
      "web-22",
    );
    expect(view?.href).toContain("4000000000");
    expect(view?.href).toContain("tag=web-22");
  });
});
