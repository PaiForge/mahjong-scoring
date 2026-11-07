import { describe, expect, it } from "vitest";

import { messages as messagesJson } from "@mahjong-scoring/messages/ja";
import { messages as enMessagesJson } from "@mahjong-scoring/messages/en";

import { kanaRowOf } from "@mahjong-scoring/features/glossary/kana";
import { collectTermSlugsInNamespace } from "./message-terms";
import {
  GLOSSARY_TERMS,
  GLOSSARY_TERM_SLUGS,
  isGlossaryTermSlug,
} from "@mahjong-scoring/features/glossary/registry";
import {
  GLOSSARY_CATEGORIES,
  isMentsuExample,
} from "@mahjong-scoring/features/glossary/types";

/**
 * 用語レジストリと辞書（日本語の辞書）の整合性検証
 *
 * 用語は「構造は TS（registry）・文言は辞書」に分けて持つ。参照は
 * `t(\`terms.${slug}.term\`)` のような動的キーなので、綴りのずれは
 * コンパイルでは落ちず、ページを開いて初めて MISSING_MESSAGE になる。
 * その穴をここで塞ぐ。
 *
 * 英語の用語ページは許可リストのテンプレート（`/reference/glossary/[slug]`）で
 * 全 slug をまとめて公開する。テンプレートは「その語が英語の辞書に揃っていること」を
 * 保証しないので、英語の辞書にも同じキーと 3 節の検査を掛ける。索引の行
 * （日本語は五十音・英語は頭文字）の割り当ては言語ごとの規則なので日本語だけを見る。
 */
interface GlossaryMessages {
  readonly glossary: {
    readonly categories: Record<string, string>;
    readonly captions: Record<string, string>;
    readonly terms: Record<
      string,
      {
        term: string;
        reading: string;
        definition: string;
        usage: string;
        caseStudy: string;
        pitfall: string;
      }
    >;
  };
}

const messages = messagesJson as unknown as GlossaryMessages;
const enMessages = enMessagesJson as unknown as GlossaryMessages;

const jaTerms = messages.glossary.terms;

/** 言語ごとの辞書（同じ検査を両方に掛ける） */
const GLOSSARY_BY_LOCALE = [
  ["ja", messages.glossary],
  ["en", enMessages.glossary],
] as const;

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

describe.each(GLOSSARY_BY_LOCALE)("用語の文言（%s）", (_locale, glossary) => {
  const { terms } = glossary;

  it.each(GLOSSARY_TERM_SLUGS.map((slug) => [slug]))(
    "%s は見出し語・読み・定義と 3 節（扱い・具体例・誤解）を持つ",
    (slug) => {
      const entry = terms[slug];
      expect(entry, "glossary.terms に該当キーが無い").toBeDefined();
      expect(entry.term).toBeTypeOf("string");
      expect(entry.term).not.toBe("");
      expect(entry.reading).toBeTypeOf("string");
      expect(entry.definition).not.toBe("");
      // 定義 1〜2 文だけの用語ページは検索側に「薄いページ」と判断される。
      // 用語ごとに符・翻・点数への関わりまで書き、節を欠く用語を作らない
      for (const key of ["usage", "caseStudy", "pitfall"] as const) {
        expect(entry[key], `${slug}.${key}`).toBeTypeOf("string");
        expect(entry[key], `${slug}.${key}`).not.toBe("");
      }
    },
  );

  it("辞書に、レジストリに無い用語が残っていない", () => {
    const known = new Set<string>(GLOSSARY_TERM_SLUGS);
    expect(Object.keys(terms).filter((slug) => !known.has(slug))).toEqual([]);
  });
});

describe("用語の読み（日本語）", () => {
  it("読みはすべて五十音のいずれかの行に割り当たる", () => {
    for (const slug of GLOSSARY_TERM_SLUGS) {
      expect(kanaRowOf(jaTerms[slug].reading), `${slug} の読み`).toBeDefined();
    }
  });
});

describe.each(GLOSSARY_BY_LOCALE)("分類（%s）", (_locale, glossary) => {
  it.each(GLOSSARY_CATEGORIES.map((category) => [category]))(
    "%s の表示名がある",
    (category) => {
      expect(glossary.categories[category]).toBeTypeOf("string");
    },
  );
});

/**
 * 明暗を名乗る用語と、その例示が鳴いた面子であるべきか
 *
 * 中張牌の明刻と暗刻は、牌を裸で並べると同じ絵になる。例示を面子として
 * 持てば描き分けは `Furo` が引き受けるが、牌の配列に書き戻せば区別は
 * また消える。語の名前が明暗を名乗っている用語だけをここで押さえる。
 */
const NAKI_IN_EXAMPLE: Readonly<Record<string, boolean>> = {
  furo: true,
  pon: true,
  chii: true,
  minkou: true,
  minkan: true,
  ankou: false,
  ankan: false,
};

describe("例示牌", () => {
  it.each(GLOSSARY_BY_LOCALE)(
    "captionKey は辞書（%s）に実在する",
    (_locale, glossary) => {
      for (const term of GLOSSARY_TERMS) {
        for (const example of term.examples ?? []) {
          if (example.captionKey === undefined) continue;
          expect(
            glossary.captions[example.captionKey],
            `${term.slug} の captionKey: ${example.captionKey}`,
          ).toBeTypeOf("string");
        }
      }
    },
  );

  it.each(Object.entries(NAKI_IN_EXAMPLE))(
    "%s の例示は鳴きの有無まで描いている",
    (slug, isFuro) => {
      const [example] = GLOSSARY_TERMS.find((term) => term.slug === slug)
        ?.examples ?? [undefined];

      if (example === undefined || !isMentsuExample(example)) {
        throw new Error(`${slug} の例示が面子ではない`);
      }
      expect(example.mentsu.furo !== undefined).toBe(isFuro);
    },
  );
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
