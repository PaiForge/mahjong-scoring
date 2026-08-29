import { describe, expect, it } from "vitest";

import messagesJson from "@/messages/ja.json";

import { kanaRowOf } from "./kana";
import { collectTermSlugsInNamespace } from "./message-terms";
import {
  GLOSSARY_TERMS,
  GLOSSARY_TERM_SLUGS,
  isGlossaryTermSlug,
} from "./registry";
import { GLOSSARY_CATEGORIES } from "./types";

/**
 * 用語レジストリと辞書（ja.json）の整合性検証
 *
 * 用語は「構造は TS（registry）・文言は辞書」に分けて持つ。参照は
 * `t(\`terms.${slug}.term\`)` のような動的キーなので、綴りのずれは
 * コンパイルでは落ちず、ページを開いて初めて MISSING_MESSAGE になる。
 * その穴をここで塞ぐ。
 */
const messages = messagesJson as unknown as {
  readonly glossary: {
    readonly categories: Record<string, string>;
    readonly captions: Record<string, string>;
    readonly terms: Record<
      string,
      { term: string; reading: string; definition: string }
    >;
  };
};

const { categories, captions, terms } = messages.glossary;

describe("用語スラッグ", () => {
  it("重複しない", () => {
    expect(new Set(GLOSSARY_TERM_SLUGS).size).toBe(GLOSSARY_TERM_SLUGS.length);
  });

  it("URL に使える文字だけでできている", () => {
    for (const slug of GLOSSARY_TERM_SLUGS) {
      expect(slug).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});

describe("用語の文言", () => {
  it.each(GLOSSARY_TERM_SLUGS.map((slug) => [slug]))(
    "%s は見出し語・読み・定義を持つ",
    (slug) => {
      const entry = terms[slug];
      expect(entry, "glossary.terms に該当キーが無い").toBeDefined();
      expect(entry.term).toBeTypeOf("string");
      expect(entry.term).not.toBe("");
      expect(entry.reading).toBeTypeOf("string");
      expect(entry.definition).not.toBe("");
    },
  );

  it("辞書に、レジストリに無い用語が残っていない", () => {
    const known = new Set<string>(GLOSSARY_TERM_SLUGS);
    expect(Object.keys(terms).filter((slug) => !known.has(slug))).toEqual([]);
  });

  it("読みはすべて五十音のいずれかの行に割り当たる", () => {
    for (const slug of GLOSSARY_TERM_SLUGS) {
      expect(kanaRowOf(terms[slug].reading), `${slug} の読み`).toBeDefined();
    }
  });
});

describe("分類", () => {
  it.each(GLOSSARY_CATEGORIES.map((category) => [category]))(
    "%s の表示名がある",
    (category) => {
      expect(categories[category]).toBeTypeOf("string");
    },
  );
});

describe("例示牌", () => {
  it("captionKey は辞書に実在する", () => {
    for (const term of GLOSSARY_TERMS) {
      for (const example of term.examples ?? []) {
        if (example.captionKey === undefined) continue;
        expect(
          captions[example.captionKey],
          `${term.slug} の captionKey: ${example.captionKey}`,
        ).toBeTypeOf("string");
      }
    }
  });

  it("faceDownIndexes は並べる牌の範囲に収まる", () => {
    for (const term of GLOSSARY_TERMS) {
      for (const example of term.examples ?? []) {
        for (const index of example.faceDownIndexes ?? []) {
          expect(index, `${term.slug}`).toBeGreaterThanOrEqual(0);
          expect(index, `${term.slug}`).toBeLessThan(example.tiles.length);
        }
      }
    }
  });
});

describe("関連語", () => {
  it("自分自身を関連語に含めない", () => {
    for (const term of GLOSSARY_TERMS) {
      expect(term.related ?? [], term.slug).not.toContain(term.slug);
    }
  });

  it("重複しない", () => {
    for (const term of GLOSSARY_TERMS) {
      const related = term.related ?? [];
      expect(new Set(related).size, term.slug).toBe(related.length);
    }
  });
});

describe("本文の用語マークアップ", () => {
  /**
   * 教本本文の `[[slug]]` は書き手が手で打つ。綴りを間違えても描画は
   * 素のテキストに落ちて壊れないため、間違いに気づけるのはここだけ。
   */
  it("辞書のどこに書かれた slug も実在する", () => {
    const unknown = Object.keys(messagesJson).flatMap((namespace) =>
      collectTermSlugsInNamespace(namespace)
        .filter((slug) => !isGlossaryTermSlug(slug))
        .map((slug) => `${namespace}: ${slug}`),
    );
    expect(unknown).toEqual([]);
  });
});
