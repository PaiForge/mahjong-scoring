import { describe, expect, it } from "vitest";

import { SITE_URL } from "@/config";

import { buildLearnArticleSchema } from "../json-ld";

const JA_DESCRIPTION =
  "麻雀の点数計算を基礎から学べるトレーニングアプリ。初心者でも符計算・点数申告をマスターできます。";

describe("buildLearnArticleSchema", () => {
  it("locale を省略すると既存の日本語の Article のまま", () => {
    const schema = buildLearnArticleSchema({
      slug: "jantou-fu",
      headline: "雀頭の符計算",
      description: "雀頭の符を学ぶ",
      publishedAt: "2026-04-18",
      operatorName: "合同会社フジ",
    });

    const url = `${SITE_URL}/lessons/jantou-fu`;
    const organization = {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "麻雀点数計算教室",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
      description: JA_DESCRIPTION,
      parentOrganization: {
        "@type": "Organization",
        name: "合同会社フジ",
        url: "https://www.fuji.llc/",
      },
    };
    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "雀頭の符計算",
      description: "雀頭の符を学ぶ",
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      inLanguage: "ja",
      image: [`${SITE_URL}/og-image.png`],
      datePublished: "2026-04-18T00:00:00+09:00",
      articleSection: "麻雀点数計算教室",
      author: organization,
      publisher: organization,
      isPartOf: {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "麻雀点数計算教室",
      },
    });
  });

  it("英語は言語ページ自身の URL・英語の inLanguage・画像・組織の説明を持つ", () => {
    const schema = buildLearnArticleSchema({
      slug: "jantou-fu",
      headline: "Pair fu",
      description: "Learn pair fu",
      publishedAt: "2026-12-01",
      operatorName: "Fuji LLC",
      locale: "en",
    });

    const url = `${SITE_URL}/en/lessons/jantou-fu`;
    expect(schema).toMatchObject({
      headline: "Pair fu",
      url,
      mainEntityOfPage: { "@id": url },
      inLanguage: "en",
      image: [`${SITE_URL}/og-image-en.png`],
      // 渡した日付（翻訳の公開日）をそのまま使い、日本語の章の日付に戻さない
      datePublished: "2026-12-01T00:00:00+09:00",
      author: { "@id": `${SITE_URL}/#organization` },
      isPartOf: { "@id": `${SITE_URL}/#website` },
    });
    expect(schema.author.description).not.toBe(JA_DESCRIPTION);
  });

  it("その言語の公開日が無ければ datePublished を出さない（日本語の日付で代用しない）", () => {
    const schema = buildLearnArticleSchema({
      slug: "jantou-fu",
      headline: "Pair fu",
      description: "Learn pair fu",
      operatorName: "Fuji LLC",
      locale: "en",
    });

    expect(schema).not.toHaveProperty("datePublished");
    expect(schema).toMatchObject({ "@type": "Article", inLanguage: "en" });
  });
});
