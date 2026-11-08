import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GLOSSARY_SITEMAP_PATHS,
  LEARN_SITEMAP_ENTRIES,
  PRACTICE_SITEMAP_PATHS,
  RANK_SITEMAP_PATHS,
  STATIC_SITEMAP_ROUTE_DEFS,
} from "@/app/_lib/sitemap-routes";
import { SITE_URL } from "@/config";
import { EN_PUBLISHED_PATHS, getPublication } from "@/i18n/route-policy";
import { getIndexableAlternates } from "@/i18n/seo-alternates";

const announcementMocks = vi.hoisted(() => ({
  getPublishedAnnouncementSlugsForSitemap: vi.fn(),
}));

vi.mock("@/lib/announcements/queries", () => announcementMocks);

import sitemap from "./sitemap";

/** DB の公開済みお知らせの見本（日本語の sitemap に載る。英語のお知らせは noindex で sitemap に載せない） */
const PUBLISHED_ANNOUNCEMENTS = [
  { slug: "fixture-a", publishedAt: new Date("2026-10-01T00:00:00Z") },
  { slug: "fixture-b", publishedAt: null },
];

/** 英語の導入前と同じ日本語の掲載 URL（並び順を含む） */
function japaneseLocs(): string[] {
  return [
    ...STATIC_SITEMAP_ROUTE_DEFS.map((route) => `${SITE_URL}${route.url}`),
    ...LEARN_SITEMAP_ENTRIES.map((entry) => `${SITE_URL}${entry.path}`),
    ...PRACTICE_SITEMAP_PATHS.map((path) => `${SITE_URL}${path}`),
    ...GLOSSARY_SITEMAP_PATHS.map((path) => `${SITE_URL}${path}`),
    ...RANK_SITEMAP_PATHS.map((path) => `${SITE_URL}${path}`),
    ...PUBLISHED_ANNOUNCEMENTS.map(
      ({ slug }) => `${SITE_URL}/announcements/${slug}`,
    ),
  ];
}

/** `loc` からロケール非依存のパスを取り出す */
function pathOf(loc: string): { locale: "ja" | "en"; path: string } {
  const pathname = loc.slice(SITE_URL.length) || "/";
  if (pathname === "/en") return { locale: "en", path: "/" };
  if (pathname.startsWith("/en/")) {
    return { locale: "en", path: pathname.slice("/en".length) };
  }
  return { locale: "ja", path: pathname };
}

describe("sitemap", () => {
  beforeEach(() => {
    announcementMocks.getPublishedAnnouncementSlugsForSitemap.mockResolvedValue(
      PUBLISHED_ANNOUNCEMENTS,
    );
  });

  it("日本語の掲載 URL と並び順は英語の導入前と同じで、英語はその後ろに並ぶ", async () => {
    const entries = await sitemap();
    const japanese = japaneseLocs();
    expect(entries.slice(0, japanese.length).map((entry) => entry.url)).toEqual(
      japanese,
    );
    expect(
      entries
        .slice(japanese.length)
        .every((entry) => pathOf(entry.url).locale === "en"),
    ).toBe(true);
  });

  it("日本語の lastmod は実データ（章・お知らせの公開日）がある項目だけに付く", async () => {
    const entries = await sitemap();
    const byUrl = new Map(entries.map((entry) => [entry.url, entry]));
    for (const { path, lastModified } of LEARN_SITEMAP_ENTRIES) {
      expect(byUrl.get(`${SITE_URL}${path}`)?.lastModified).toBe(lastModified);
    }
    expect(
      byUrl.get(`${SITE_URL}/announcements/fixture-a`)?.lastModified,
    ).toEqual(PUBLISHED_ANNOUNCEMENTS[0].publishedAt);
    expect(byUrl.get(`${SITE_URL}/announcements/fixture-b`)).not.toHaveProperty(
      "lastModified",
    );
    expect(byUrl.get(`${SITE_URL}/practice`)).not.toHaveProperty(
      "lastModified",
    );
  });

  it("英語は published-indexable のページだけを 1 回ずつ載せる（未公開・noindex・お知らせを載せない）", async () => {
    const entries = await sitemap();
    const english = entries
      .map((entry) => pathOf(entry.url))
      .filter((loc) => loc.locale === "en")
      .map((loc) => loc.path);
    expect(english.sort()).toEqual(
      EN_PUBLISHED_PATHS.filter(
        (path) => getPublication(path, "en") === "published-indexable",
      ).sort(),
    );
    expect(new Set(english).size).toBe(english.length);
  });

  it("URL は重複しない", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("各 URL の hreflang は HTML と同じ getIndexableAlternates の出力", async () => {
    for (const entry of await sitemap()) {
      const expected = getIndexableAlternates(pathOf(entry.url).path);
      expect(entry.alternates?.languages ?? {}, entry.url).toEqual({
        ...expected,
      });
    }
  });

  it("日本語だけのページは ja と x-default、両言語のページは ja・en・x-default を持つ", async () => {
    const byUrl = new Map((await sitemap()).map((entry) => [entry.url, entry]));
    // お知らせは英語で出すが索引させない（英語で書いた行だけ）ので、日本語だけで索引させる
    for (const path of ["/announcements", "/announcements/fixture-a"]) {
      expect(
        Object.keys(
          byUrl.get(`${SITE_URL}${path}`)?.alternates?.languages ?? {},
        ),
        path,
      ).toEqual(["ja", "x-default"]);
    }
    for (const url of [
      `${SITE_URL}/en/reference/score-table`,
      `${SITE_URL}/plan`,
      `${SITE_URL}/en/plan`,
      `${SITE_URL}/en/terms`,
    ]) {
      expect(
        Object.keys(byUrl.get(url)?.alternates?.languages ?? {}),
        url,
      ).toEqual(["ja", "en", "x-default"]);
    }
  });

  it("英語の項目は日本語の同じページの changefreq・priority を引き継ぐ", async () => {
    const byUrl = new Map((await sitemap()).map((entry) => [entry.url, entry]));
    const ja = byUrl.get(`${SITE_URL}/reference/score-table`);
    const en = byUrl.get(`${SITE_URL}/en/reference/score-table`);
    expect(en?.changeFrequency).toBe(ja?.changeFrequency);
    expect(en?.priority).toBe(ja?.priority);
  });
});
