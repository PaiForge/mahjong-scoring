import { describe, expect, it } from "vitest";

import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import { filterGlossaryTerms } from "./search";
import { glossaryTermViews } from "./views";

/** 日本語の辞書の `glossary` を引く翻訳関数 */
function jaGlossary(key: string): string {
  let node: unknown = jaMessages.glossary;
  for (const segment of key.split(".")) {
    node = (node as Record<string, unknown>)[segment];
  }
  return String(node);
}

const terms = glossaryTermViews(jaGlossary);

function slugs(query: string, category?: "hai" | "naki") {
  return filterGlossaryTerms(terms, { query, category }).map((t) => t.slug);
}

describe("filterGlossaryTerms", () => {
  it("条件が空なら全部を順番どおりに返す", () => {
    expect(slugs("")).toEqual(terms.map((t) => t.slug));
    expect(slugs("   ")).toEqual(terms.map((t) => t.slug));
  });

  it("見出し語の一部で引ける", () => {
    const found = filterGlossaryTerms(terms, {
      query: "暗",
      category: undefined,
    });
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((t) => t.term.includes("暗"))).toBe(true);
  });

  it("ひらがなで打ってもカタカナの読みに当たる", () => {
    const byHiragana = slugs("あんこ");
    expect(byHiragana.length).toBeGreaterThan(0);
    expect(byHiragana).toEqual(slugs("アンコ"));
  });

  it("分類で絞り、検索と重ねられる", () => {
    const naki = filterGlossaryTerms(terms, { query: "", category: "naki" });
    expect(naki.length).toBeGreaterThan(0);
    expect(naki.every((t) => t.category === "naki")).toBe(true);
    const both = filterGlossaryTerms(terms, { query: "暗", category: "naki" });
    expect(both.every((t) => t.category === "naki")).toBe(true);
    expect(both.length).toBeLessThan(naki.length);
  });

  it("当たらなければ空", () => {
    expect(slugs("zzzzzz")).toEqual([]);
  });
});
