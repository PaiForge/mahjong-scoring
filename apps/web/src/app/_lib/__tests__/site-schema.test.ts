import { describe, expect, it } from "vitest";

import { SITE_URL } from "@/config";

import {
  buildOrganizationSchema,
  buildSiteSchema,
  buildWebSiteRef,
} from "../site-schema";

/**
 * サイトの構造化データ（Organization / WebSite）。
 *
 * 日本語の出力は言語の引数を足す前と同じ値をリテラルで固定する（本体を写すと
 * 本体と同じ誤りを持つ）。英語は同じ `@id` のまま、テキストと `inLanguage` だけが
 * 英語になることを見る。
 */
const JA_DESCRIPTION =
  "麻雀の点数計算を基礎から学べるトレーニングアプリ。初心者でも符計算・点数申告をマスターできます。";
const EN_DESCRIPTION =
  "Learn riichi mahjong score calculation from the basics. A practice app that helps beginners master counting fu and calling out scores.";

describe("buildSiteSchema", () => {
  it("locale を省略すると既存の日本語の JSON-LD のまま", () => {
    expect(buildSiteSchema("合同会社フジ")).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
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
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          url: SITE_URL,
          name: "麻雀点数計算教室",
          description: JA_DESCRIPTION,
          inLanguage: "ja",
          image: `${SITE_URL}/og-image.png`,
          publisher: { "@id": `${SITE_URL}/#organization` },
        },
      ],
    });
  });

  it("英語は同じ組織・同じサイトの @id のまま、説明・inLanguage・画像を英語にする", () => {
    const schema = buildSiteSchema("Fuji LLC", "en");
    const [organization, website] = schema["@graph"];

    expect(organization).toMatchObject({
      "@id": `${SITE_URL}/#organization`,
      name: "麻雀点数計算教室",
      url: SITE_URL,
      description: EN_DESCRIPTION,
      parentOrganization: { name: "Fuji LLC" },
    });
    expect(website).toEqual({
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "麻雀点数計算教室",
      description: EN_DESCRIPTION,
      inLanguage: "en",
      image: `${SITE_URL}/og-image-en.png`,
      publisher: { "@id": `${SITE_URL}/#organization` },
    });
  });
});

describe("buildOrganizationSchema", () => {
  it("locale を省略すると日本語の説明", () => {
    expect(buildOrganizationSchema("x").description).toBe(JA_DESCRIPTION);
  });
});

describe("buildWebSiteRef", () => {
  it("言語に依らない参照（@id・URL・名前だけ）", () => {
    expect(buildWebSiteRef()).toEqual({
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "麻雀点数計算教室",
    });
  });
});
