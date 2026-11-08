import { describe, expect, it, vi } from "vitest";

// 実物の react-native は Node で読めない。この検査は読み上げの名前だけを見る
vi.mock("react-native", () => ({ Linking: { openURL: vi.fn() } }));

const { nativeAdAccessibilityLabel } = await import("./open-native-ad");

describe("nativeAdAccessibilityLabel", () => {
  it("区切りを省くと日本語の「、」で、広告の印・題名・説明の順に読む（従来の文字列）", () => {
    expect(
      nativeAdAccessibilityLabel("PR", {
        title: "麻雀の本",
        description: "点数計算の入門",
      }),
    ).toBe("PR、麻雀の本、点数計算の入門");
  });

  it("説明の無い広告は区切りを重ねない", () => {
    expect(
      nativeAdAccessibilityLabel("PR", {
        title: "麻雀の本",
        description: undefined,
      }),
    ).toBe("PR、麻雀の本");
  });

  it("英語の区切りを渡すと「, 」で区切る", () => {
    expect(
      nativeAdAccessibilityLabel(
        "Ad",
        { title: "Mahjong book", description: "Scoring basics" },
        ", ",
      ),
    ).toBe("Ad, Mahjong book, Scoring basics");
  });
});
