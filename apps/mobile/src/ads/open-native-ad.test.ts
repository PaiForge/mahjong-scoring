import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  languageTags: ["ja-JP"] as string[],
}));

// 実物の react-native は Node で読めない。この検査は読み上げの名前だけを見る
vi.mock("react-native", () => ({ Linking: { openURL: vi.fn() } }));

// アプリの言語（`lib/app-locale.ts`）は端末の言語タグから決まる
vi.mock("expo-localization", () => ({
  getLocales: () =>
    mocks.languageTags.map((languageTag) => ({
      languageTag,
      languageCode: languageTag.split("-")[0],
    })),
}));

/**
 * 端末の言語を差し替えてから、モジュールを評価し直して読む
 * （既定の区切りはアプリの言語から評価時に 1 回決まる）
 */
async function loadWith(languageTags: string[]) {
  mocks.languageTags = languageTags;
  vi.resetModules();
  return import("./open-native-ad");
}

beforeEach(() => {
  mocks.languageTags = ["ja-JP"];
});

describe("nativeAdAccessibilityLabel", () => {
  it("日本語の端末で区切りを省くと「、」で、広告の印・題名・説明の順に読む（従来の文字列）", async () => {
    const { nativeAdAccessibilityLabel } = await loadWith(["ja-JP"]);

    expect(
      nativeAdAccessibilityLabel("PR", {
        title: "麻雀の本",
        description: "点数計算の入門",
      }),
    ).toBe("PR、麻雀の本、点数計算の入門");
  });

  it("英語の端末で区切りを省くと「, 」で区切る", async () => {
    const { nativeAdAccessibilityLabel } = await loadWith(["en-US"]);

    expect(
      nativeAdAccessibilityLabel("Ad", {
        title: "Mahjong book",
        description: "Scoring basics",
      }),
    ).toBe("Ad, Mahjong book, Scoring basics");
  });

  it("説明の無い広告は区切りを重ねない", async () => {
    const { nativeAdAccessibilityLabel } = await loadWith(["ja-JP"]);

    expect(
      nativeAdAccessibilityLabel("PR", {
        title: "麻雀の本",
        description: undefined,
      }),
    ).toBe("PR、麻雀の本");
  });

  it("区切りを渡すと端末の言語に依らずその区切りを使う", async () => {
    const { nativeAdAccessibilityLabel } = await loadWith(["ja-JP"]);

    expect(
      nativeAdAccessibilityLabel(
        "Ad",
        { title: "Mahjong book", description: "Scoring basics" },
        ", ",
      ),
    ).toBe("Ad, Mahjong book, Scoring basics");
  });
});
