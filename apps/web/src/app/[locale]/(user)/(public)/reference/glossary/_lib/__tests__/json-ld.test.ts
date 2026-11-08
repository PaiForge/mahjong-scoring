import { describe, expect, it } from "vitest";

import { SITE_URL } from "@/config";

import { glossaryTermViews } from "@mahjong-scoring/features/glossary/views";

import { buildDefinedTermSchema, buildDefinedTermSetSchema } from "../json-ld";

/** キーをそのまま返す翻訳関数（JSON-LD の URL と言語だけを見るため） */
const [term] = glossaryTermViews((key) => key);

describe("buildDefinedTermSetSchema", () => {
  it("locale を省略すると既存の日本語の URL と inLanguage のまま", () => {
    const schema = buildDefinedTermSetSchema({
      name: "用語集",
      description: "説明",
      terms: [term],
    });

    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      name: "用語集",
      description: "説明",
      url: `${SITE_URL}/reference/glossary`,
      inLanguage: "ja",
      hasDefinedTerm: [
        {
          "@type": "DefinedTerm",
          name: term.term,
          description: term.definition,
          url: `${SITE_URL}/reference/glossary/${term.slug}`,
        },
      ],
    });
  });

  it("英語は一覧と各語の URL を英語のページにし、inLanguage を en にする", () => {
    const schema = buildDefinedTermSetSchema({
      name: "Glossary",
      description: "About",
      terms: [term],
      locale: "en",
    });

    expect(schema).toMatchObject({
      url: `${SITE_URL}/en/reference/glossary`,
      inLanguage: "en",
      hasDefinedTerm: [
        { url: `${SITE_URL}/en/reference/glossary/${term.slug}` },
      ],
    });
  });
});

describe("buildDefinedTermSchema", () => {
  it("locale を省略すると既存の日本語の JSON-LD のまま", () => {
    expect(buildDefinedTermSchema({ term, termSetName: "用語集" })).toEqual({
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: term.term,
      description: term.definition,
      url: `${SITE_URL}/reference/glossary/${term.slug}`,
      inLanguage: "ja",
      inDefinedTermSet: {
        "@type": "DefinedTermSet",
        name: "用語集",
        url: `${SITE_URL}/reference/glossary`,
      },
    });
  });

  it("英語の用語は言語ページごとの URL を持ち、日本語の URL を指さない", () => {
    const schema = buildDefinedTermSchema({
      term,
      termSetName: "Glossary",
      locale: "en",
    });

    expect(schema).toMatchObject({
      url: `${SITE_URL}/en/reference/glossary/${term.slug}`,
      inLanguage: "en",
      inDefinedTermSet: { url: `${SITE_URL}/en/reference/glossary` },
    });
  });
});
