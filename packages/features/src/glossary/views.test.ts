import { describe, expect, it } from "vitest";

import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import { GLOSSARY_TERM_SLUGS } from "./registry";
import { glossaryTermViewBySlug, glossaryTermViews } from "./views";

/** 日本語の辞書の `glossary` を引く翻訳関数 */
function jaGlossary(key: string): string {
  let node: unknown = jaMessages.glossary;
  for (const segment of key.split(".")) {
    node = (node as Record<string, unknown>)[segment];
  }
  return String(node);
}

/**
 * 辞書に依らない英語の翻訳関数
 *
 * 英語の辞書は翻訳の途中で日本語の写しのことがあるため、並びと索引の行の検査は
 * slug から作った英語の見出し語で行う（`terms.<slug>.term` → slug を逆順にした
 * 語の先頭を大文字にしたもの。読みは見出し語と逆の順になるよう slug そのまま）。
 */
function fakeEnglish(key: string): string {
  const [, slug, field] = key.split(".");
  if (field === "term") {
    const reversed = [...slug].reverse().join("");
    return reversed.charAt(0).toUpperCase() + reversed.slice(1);
  }
  if (field === "reading") return slug;
  return `${field} of ${slug}`;
}

describe("glossaryTermViews", () => {
  it("locale を省くと日本語（読みの五十音順・五十音行）で、ja を渡したときと同じ", () => {
    const implicit = glossaryTermViews(jaGlossary);
    expect(glossaryTermViews(jaGlossary, "ja")).toEqual(implicit);

    const readings = implicit.map((view) => view.reading);
    expect(readings).toEqual(
      [...readings].sort((a, b) => a.localeCompare(b, "ja")),
    );
    for (const view of implicit) {
      expect(view.indexRow, view.slug).toBeDefined();
    }
  });

  it("英語は見出し語の英字順に並び、行は見出し語の頭文字", () => {
    const views = glossaryTermViews(fakeEnglish, "en");
    expect(views).toHaveLength(GLOSSARY_TERM_SLUGS.length);

    const headings = views.map((view) => view.term);
    expect(headings).toEqual(
      [...headings].sort((a, b) => a.localeCompare(b, "en")),
    );
    for (const view of views) {
      expect(view.indexRow, view.slug).toBe(view.term.charAt(0).toUpperCase());
    }
  });

  it("href は言語に依らないパス（接頭辞は描く側が付ける）", () => {
    const [ja] = glossaryTermViews(jaGlossary);
    const en = glossaryTermViews(fakeEnglish, "en").find(
      (view) => view.slug === ja.slug,
    );
    expect(en?.href).toBe(ja.href);
    expect(ja.href).toBe(`/reference/glossary/${ja.slug}`);
  });
});

describe("glossaryTermViewBySlug", () => {
  it("英語を渡すとその言語の索引の行を持つ", () => {
    const view = glossaryTermViewBySlug("jantou", fakeEnglish, "en");
    expect(view?.term).toBe("Uotnaj");
    expect(view?.indexRow).toBe("U");
  });

  it("locale を省くと日本語の五十音行", () => {
    expect(glossaryTermViewBySlug("jantou", jaGlossary)?.indexRow).toBe("さ");
  });
});
