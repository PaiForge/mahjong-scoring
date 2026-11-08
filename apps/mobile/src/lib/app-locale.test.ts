import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  languageTags: [] as string[],
}));

vi.mock("expo-localization", () => ({
  getLocales: () =>
    mocks.languageTags.map((languageTag) => ({
      languageTag,
      languageCode: languageTag.split("-")[0],
    })),
}));

/**
 * 端末の言語を差し替えてから、モジュールを評価し直して読む（値は評価時に 1 回決まる）。
 * 評価し直すと辞書のモジュールも読み直されるので、辞書は同一性ではなく中身で比べる
 */
async function loadWith(languageTags: string[]) {
  mocks.languageTags = languageTags;
  vi.resetModules();
  return import("./app-locale");
}

beforeEach(() => {
  mocks.languageTags = [];
});

describe("APP_LOCALE / APP_MESSAGES", () => {
  it("日本語の端末は日本語の辞書", async () => {
    const { APP_LOCALE, APP_MESSAGES } = await loadWith(["ja-JP"]);

    expect(APP_LOCALE).toBe("ja");
    expect(APP_MESSAGES).toStrictEqual(jaMessages);
  });

  it("英語の端末は英語の辞書", async () => {
    const { APP_LOCALE, APP_MESSAGES } = await loadWith(["en-US"]);

    expect(APP_LOCALE).toBe("en");
    expect(APP_MESSAGES).toStrictEqual(enMessages);
  });

  it("日本語でも英語でもない端末は英語（優先順の後ろの対応言語があればそれ）", async () => {
    expect((await loadWith(["fr-FR"])).APP_LOCALE).toBe("en");
    expect((await loadWith(["fr-FR", "ja-JP"])).APP_LOCALE).toBe("ja");
  });

  it("言語コードではなく言語タグで判定する（地域が日本なだけの別の言語は英語）", async () => {
    expect((await loadWith(["zh-Hant-JP"])).APP_LOCALE).toBe("en");
  });
});
