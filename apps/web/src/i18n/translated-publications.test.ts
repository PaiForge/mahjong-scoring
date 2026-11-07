import { describe, expect, it } from "vitest";

import { EN_PUBLISHED_PATHS, getPublication } from "./route-policy";
import {
  getTranslatedPublication,
  publishedHomeHref,
  translatedPublishedPaths,
} from "./translated-publications";

describe("getTranslatedPublication", () => {
  it("英語の許可リストにあるパスだけを公開とする（query・hash は無視）", () => {
    expect(getTranslatedPublication("/reference/score-table", "en")).toBe(
      "published-indexable",
    );
    expect(
      getTranslatedPublication("/reference/score-table?han=3#x", "en"),
    ).toBe("published-indexable");
    expect(getTranslatedPublication("/practice", "en")).toBe("unpublished");
    expect(getTranslatedPublication("/", "en")).toBe("unpublished");
  });

  it("route-policy の英語の判定と一致する（判定を二重に持たない）", () => {
    for (const path of ["/", "/practice", ...EN_PUBLISHED_PATHS]) {
      expect(getPublication(path, "en")).toBe(
        getTranslatedPublication(path, "en"),
      );
    }
    expect(EN_PUBLISHED_PATHS).toEqual(translatedPublishedPaths("en"));
  });
});

describe("publishedHomeHref", () => {
  it("日本語は接頭辞なしのトップ", () => {
    expect(publishedHomeHref("ja")).toBe("/");
  });

  it("英語のトップが未公開なら日本語のトップへ向ける（404 へ案内しない）", () => {
    expect(getTranslatedPublication("/", "en")).toBe("unpublished");
    expect(publishedHomeHref("en")).toBe("/");
  });
});
