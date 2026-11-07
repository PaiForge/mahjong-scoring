import { describe, expect, it } from "vitest";

import {
  GLOSSARY_SITEMAP_PATHS,
  INDEXABLE_PATHS,
  RANK_SITEMAP_PATHS,
} from "@/app/_lib/sitemap-routes";
import { EN_PUBLISHED_PATHS, getPublication } from "@/i18n/route-policy";
import { getIndexableAlternates, productionUrl } from "@/i18n/seo-alternates";

import {
  EN_INDEXABLE_PATHS,
  EN_NOINDEX_PATHS,
  expectedAlternates,
  expectedUrl,
  parseSiteUrl,
} from "./expectations";

/**
 * 監査の期待値（`expectations.ts`）がアプリの公開状態と食い違っていないことの検査
 *
 * 監査は期待値をアプリのモジュールから読まずに独立に持つ（理由は
 * `expectations.ts` の TSDoc）。その代わり、ここで両者が一致することを確かめる。
 */

/** 規則を突き合わせるパス（索引対象・noindex・未公開・英語の公開を含む） */
const SAMPLE_PATHS: readonly string[] = [
  ...INDEXABLE_PATHS,
  ...GLOSSARY_SITEMAP_PATHS,
  ...RANK_SITEMAP_PATHS,
  ...EN_PUBLISHED_PATHS,
  "/announcements/sample-announcement",
  "/practice/jantou-fu/play",
  "/practice/jantou-fu/result",
  "/mypage",
  "/sign-in",
  "/u/alice",
  "/leaderboard/monthly/jantou-fu",
  "/admin",
  "/nonexistent",
];

describe("監査の期待値とアプリの公開状態", () => {
  it("英語で索引させるパスは route-policy の published-indexable と同じ集合", () => {
    expect([...EN_INDEXABLE_PATHS].sort()).toEqual(
      EN_PUBLISHED_PATHS.filter(
        (path) => getPublication(path, "en") === "published-indexable",
      ).sort(),
    );
  });

  it("英語で出して索引させないパスは route-policy の published-noindex と同じ集合", () => {
    expect([...EN_NOINDEX_PATHS].sort()).toEqual(
      EN_PUBLISHED_PATHS.filter(
        (path) => getPublication(path, "en") === "published-noindex",
      ).sort(),
    );
  });

  it.each(SAMPLE_PATHS.map((path) => [path]))(
    "%s の hreflang の期待値は getIndexableAlternates と一致する",
    (path) => {
      expect(
        expectedAlternates(
          path,
          getPublication(path, "ja") === "published-indexable",
          getPublication(path, "en") === "published-indexable",
        ),
      ).toEqual({ ...getIndexableAlternates(path) });
    },
  );

  // `/admin` は `app/[locale]` の外で、productionUrl はロケール接頭辞を付けない
  it.each(
    SAMPLE_PATHS.filter((path) => path !== "/admin").flatMap((path) => [
      [path, "ja"],
      [path, "en"],
    ]),
  )(
    "%s（%s）の本番 URL は productionUrl と一致し、元のパスへ戻せる",
    (path, locale) => {
      const supported = locale === "en" ? "en" : "ja";
      expect(expectedUrl(path, supported)).toBe(productionUrl(path, supported));
      expect(parseSiteUrl(expectedUrl(path, supported))).toEqual({
        locale: supported,
        path,
      });
    },
  );

  it("本番の origin でない URL は解釈しない", () => {
    expect(parseSiteUrl("https://example.com/practice")).toBeUndefined();
    expect(parseSiteUrl("https://score.mahjong.help.evil/x")).toBeUndefined();
  });
});
