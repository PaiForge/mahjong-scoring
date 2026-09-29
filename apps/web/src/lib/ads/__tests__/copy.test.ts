import { describe, expect, it } from "vitest";

import {
  copyFromTranslationRows,
  copyToTranslationRows,
  resolveCreativeCopy,
} from "../copy";

describe("resolveCreativeCopy", () => {
  it("閲覧者のロケールの文言を返す", () => {
    const copy = {
      title: { ja: "麻雀の本", en: "Mahjong book" },
      description: { ja: "説明", en: "Description" },
    };
    expect(resolveCreativeCopy(copy, "en")).toEqual({
      title: "Mahjong book",
      description: "Description",
    });
  });

  it("空いた項目は項目ごとに既定ロケール（ja）へ落ちる", () => {
    const copy = {
      title: { ja: "麻雀の本", en: "Mahjong book" },
      description: { ja: "説明" },
    };
    expect(resolveCreativeCopy(copy, "en")).toEqual({
      title: "Mahjong book",
      description: "説明",
    });
  });

  it("説明はどのロケールにも無ければ undefined、タイトルは空文字", () => {
    expect(resolveCreativeCopy({ title: {}, description: {} }, "ja")).toEqual({
      title: "",
      description: undefined,
    });
  });
});

describe("copyFromTranslationRows", () => {
  it("行を広告ごとにまとめ、NULL の項目は持たない", () => {
    const map = copyFromTranslationRows([
      { creativeId: "a", locale: "ja", title: "本", description: null },
      { creativeId: "a", locale: "en", title: null, description: "Desc" },
      { creativeId: "b", locale: "ja", title: "別", description: "説明" },
    ]);
    expect(map.get("a")).toEqual({
      title: { ja: "本" },
      description: { en: "Desc" },
    });
    expect(map.get("b")).toEqual({
      title: { ja: "別" },
      description: { ja: "説明" },
    });
  });

  it("対応していないロケールの行は読み飛ばす", () => {
    const map = copyFromTranslationRows([
      { creativeId: "a", locale: "fr", title: "Livre", description: null },
    ]);
    expect(map.has("a")).toBe(false);
  });
});

describe("copyToTranslationRows", () => {
  it("何も書いていないロケールは行を作らない", () => {
    expect(
      copyToTranslationRows("a", {
        title: { ja: "本" },
        description: {},
      }),
    ).toEqual([
      { creativeId: "a", locale: "ja", title: "本", description: null },
    ]);
  });
});
