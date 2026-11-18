import { describe, expect, it } from "vitest";

import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import { HaiKind } from "@mahjong-scoring/core";

import { exampleMinkan, exampleMinkou } from "../board/example-mentsu";
import { GLOSSARY_TERM_SLUGS } from "./registry";
import {
  glossaryTermPreview,
  glossaryTermViewBySlug,
  glossaryTermViews,
} from "./views";

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
  it("日本語は読みの五十音順に並び、どの語も五十音の行に入る", () => {
    const views = glossaryTermViews(jaGlossary, "ja");

    const readings = views.map((view) => view.reading);
    expect(readings).toEqual(
      [...readings].sort((a, b) => a.localeCompare(b, "ja")),
    );
    for (const view of views) {
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
    const [ja] = glossaryTermViews(jaGlossary, "ja");
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

  it("見出し語・読み・定義と用語ページの 3 節をそれぞれの辞書キーから引く", () => {
    const view = glossaryTermViewBySlug("jantou", fakeEnglish, "en");
    expect(view).toMatchObject({
      slug: "jantou",
      reading: "jantou",
      definition: "definition of jantou",
      usage: "usage of jantou",
      caseStudy: "caseStudy of jantou",
      pitfall: "pitfall of jantou",
      href: "/reference/glossary/jantou",
    });
  });

  it("未知の slug は undefined", () => {
    expect(
      glossaryTermViewBySlug("no-such-term", jaGlossary, "ja"),
    ).toBeUndefined();
  });

  it("日本語を渡すと五十音の行を持つ", () => {
    expect(glossaryTermViewBySlug("jantou", jaGlossary, "ja")?.indexRow).toBe(
      "さ",
    );
  });
});

describe("glossaryTermPreview", () => {
  it("例を持たない用語は見出し語・読み・定義とリンク先だけを持つ", () => {
    expect(glossaryTermPreview("otakaze", jaGlossary)).toEqual({
      slug: "otakaze",
      term: jaMessages.glossary.terms.otakaze.term,
      reading: jaMessages.glossary.terms.otakaze.reading,
      definition: jaMessages.glossary.terms.otakaze.definition,
      href: "/reference/glossary/otakaze",
    });
  });

  it("注記の無い牌の例は牌だけを載せる", () => {
    expect(glossaryTermPreview("manzu", jaGlossary)?.example).toEqual({
      tiles: [HaiKind.ManZu1, HaiKind.ManZu5, HaiKind.ManZu9],
    });
  });

  it("注記のある牌の例は注記を辞書の captions から引いて添える", () => {
    expect(glossaryTermPreview("shuupai", jaGlossary)?.example).toEqual({
      tiles: [HaiKind.ManZu1, HaiKind.PinZu5, HaiKind.SouZu9],
      caption: jaMessages.glossary.captions.threeSuits,
    });
  });

  it("面子の例は牌の並びではなく面子のまま渡す", () => {
    expect(glossaryTermPreview("pon", jaGlossary)?.example).toEqual({
      mentsu: exampleMinkou(HaiKind.PinZu8),
      caption: jaMessages.glossary.captions.ponExample,
    });
  });

  it("例が複数ある用語も最初の 1 組だけを載せる", () => {
    expect(glossaryTermPreview("kan", jaGlossary)?.example).toEqual({
      mentsu: exampleMinkan(HaiKind.SouZu5),
      caption: jaMessages.glossary.captions.minkanExample,
    });
  });

  it("未知の slug は undefined（呼び出し側は素のテキストに戻す）", () => {
    expect(glossaryTermPreview("no-such-term", jaGlossary)).toBeUndefined();
  });
});
