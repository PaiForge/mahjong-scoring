import { describe, expect, it } from "vitest";

import { CURRICULUM } from "@mahjong-scoring/features/curriculum/registry";
import { GLOSSARY_TERM_SLUGS } from "@mahjong-scoring/features/glossary/registry";
import { glossaryTermHref } from "@mahjong-scoring/features/glossary/routes";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { EN_PUBLISHED_PATHS, getPublication } from "./route-policy";
import {
  getTranslatedPublication,
  publishedHomeHref,
  translatedPublishedPaths,
  translatedPublishedTemplates,
  translatedTemplateOf,
} from "./translated-publications";

/** 英語で公開する公開単位（完全一致の行） */
const EN_EXACT_PATHS = [
  "/",
  "/lessons",
  ...CURRICULUM.filter((chapter) => chapter.slug !== "about-this-app").map(
    (chapter) => chapterHref(chapter.slug),
  ),
  "/reference",
  "/reference/yaku",
  "/reference/glossary",
  "/reference/score-table",
];

describe("getTranslatedPublication", () => {
  it("英語の許可リストの完全一致の行は公開して索引させる（query・hash は無視）", () => {
    for (const path of EN_EXACT_PATHS) {
      expect(getTranslatedPublication(path, "en"), path).toBe(
        "published-indexable",
      );
    }
    expect(
      getTranslatedPublication("/reference/score-table?han=3#x", "en"),
    ).toBe("published-indexable");
    expect(getTranslatedPublication("/lessons?rank=5-kyu", "en")).toBe(
      "published-indexable",
    );
  });

  it("完全一致の行は公開単位どおり（トップ・目次・はじめにを除く 19 章・早見表 4 ページ）", () => {
    expect([...translatedPublishedPaths("en")].sort()).toEqual(
      [...EN_EXACT_PATHS].sort(),
    );
    expect(
      translatedPublishedPaths("en").filter((path) =>
        path.startsWith("/lessons/"),
      ),
    ).toHaveLength(19);
  });

  it("はじめに（about-this-app）は英語で出さない（紹介する画面が英語で未公開）", () => {
    expect(getTranslatedPublication("/lessons/about-this-app", "en")).toBe(
      "unpublished",
    );
  });

  it("用語のページはテンプレートで公開し、全用語が当たる", () => {
    expect(translatedPublishedTemplates("en")).toEqual([
      "/reference/glossary/[slug]",
    ]);
    for (const slug of GLOSSARY_TERM_SLUGS) {
      const path = glossaryTermHref(slug);
      expect(getTranslatedPublication(path, "en"), path).toBe(
        "published-indexable",
      );
      expect(translatedTemplateOf(path, "en")).toBe(
        "/reference/glossary/[slug]",
      );
    }
  });

  it("slug の形（英小文字で始まる英数字とハイフン）に合わない語は unpublished（proxy が 404 にする）", () => {
    expect(
      getTranslatedPublication("/reference/glossary/__unknown__", "en"),
    ).toBe("unpublished");
  });

  it("テンプレートに合うがレジストリに無い slug も許可リストは公開と返す（404 はページの dynamicParams = false が返す）", () => {
    expect(
      getTranslatedPublication("/reference/glossary/unknown-term", "en"),
    ).toBe("published-indexable");
  });

  it.each([
    ["/practice"],
    ["/dashboard"],
    ["/getting-started"],
    ["/reference/demo"],
    ["/reference/glossary/"],
    ["/reference/glossary/jantou/extra"],
    ["/reference/glossary/Jantou"],
    ["/lessons/jantou-fu/extra"],
  ])("%s は英語で unpublished", (path) => {
    expect(getTranslatedPublication(path, "en")).toBe("unpublished");
    expect(translatedTemplateOf(path, "en")).toBeUndefined();
  });

  it("完全一致の行はテンプレートに畳まない", () => {
    expect(translatedTemplateOf("/reference/glossary", "en")).toBeUndefined();
    expect(translatedTemplateOf("/lessons/jantou-fu", "en")).toBeUndefined();
  });

  it("route-policy の英語の判定と一致する（判定を二重に持たない）", () => {
    for (const path of [
      "/practice",
      "/lessons/about-this-app",
      "/reference/glossary/unknown-term",
      ...EN_PUBLISHED_PATHS,
    ]) {
      expect(getPublication(path, "en")).toBe(
        getTranslatedPublication(path, "en"),
      );
    }
  });

  it("EN_PUBLISHED_PATHS は完全一致の行とテンプレートの展開（全用語）", () => {
    expect(EN_PUBLISHED_PATHS).toEqual([
      ...translatedPublishedPaths("en"),
      ...GLOSSARY_TERM_SLUGS.map(glossaryTermHref),
    ]);
  });
});

describe("publishedHomeHref", () => {
  it("日本語は接頭辞なしのトップ", () => {
    expect(publishedHomeHref("ja")).toBe("/");
  });

  it("英語のトップを公開しているので英語のトップへ向ける", () => {
    expect(getTranslatedPublication("/", "en")).toBe("published-indexable");
    expect(publishedHomeHref("en")).toBe("/en");
  });
});
