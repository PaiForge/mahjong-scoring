import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  GLOSSARY_SITEMAP_PATHS,
  INDEXABLE_PATHS,
  RANK_SITEMAP_PATHS,
} from "@/app/_lib/sitemap-routes";
import { collectPages } from "@/test/collect-pages";
import { GLOSSARY_TERM_SLUGS } from "@mahjong-scoring/features/glossary/registry";
import { glossaryTermHref } from "@mahjong-scoring/features/glossary/routes";
import { RANK_SLUGS } from "@mahjong-scoring/features/ranks/registry";
import { rankHref } from "@mahjong-scoring/features/routes";

import {
  EN_PUBLISHED_PATHS,
  getPublication,
  isPublished,
  type Publication,
} from "./route-policy";

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "../app");

/** `app/[locale]` のディレクトリが URL に足す接頭辞（ロケール非依存のパスへ戻すときに外す） */
const LOCALE_SEGMENT = "/[locale]";

/**
 * `app/[locale]/(user)` 配下のページを「ロケール非依存のパスのテンプレート →
 * page.tsx」で集める
 */
function collectUserPages(): Map<string, string> {
  const userPages = new Map<string, string>();
  for (const [urlPath, file] of collectPages(APP_DIR)) {
    if (!file.includes(`${sep}(user)${sep}`)) continue;
    if (!urlPath.startsWith(LOCALE_SEGMENT)) continue;
    const template = urlPath.slice(LOCALE_SEGMENT.length) || "/";
    userPages.set(template, file);
  }
  return userPages;
}

/**
 * 動的ルートのテンプレートを、判定に使う具体的なパスへ展開する
 *
 * レジストリが値を持つもの（用語・段級位）は全値、DB 由来のものは見本の値。
 * 動的ルートを足したらここに足す（無ければ下のテストが落ちる）。
 */
const DYNAMIC_ROUTE_SAMPLES: Readonly<Record<string, readonly string[]>> = {
  "/announcements/[slug]": ["/announcements/sample-announcement"],
  "/dojo/ranks/[slug]": RANK_SLUGS.map(rankHref),
  "/reference/glossary/[slug]": GLOSSARY_TERM_SLUGS.map(glossaryTermHref),
  "/leaderboard/[period]/[module]": ["/leaderboard/monthly/jantou-fu"],
  "/u/[username]": ["/u/alice"],
};

/** テンプレートを具体的なパスの一覧にする（静的ルートはそのまま 1 件） */
function concretePaths(template: string): readonly string[] {
  if (!template.includes("[")) return [template];
  return DYNAMIC_ROUTE_SAMPLES[template] ?? [];
}

const userPages = collectUserPages();

/** sitemap に載る日本語のパス（DB 由来のお知らせ詳細を除く） */
const SITEMAP_PATHS: ReadonlySet<string> = new Set([
  ...INDEXABLE_PATHS,
  ...GLOSSARY_SITEMAP_PATHS,
  ...RANK_SITEMAP_PATHS,
]);

describe("日本語の公開状態は既存の分類を取り込む", () => {
  it("app/[locale]/(user) の page.tsx が見つかる（テスト自体の健全性）", () => {
    expect(userPages.size).toBeGreaterThan(0);
    expect(userPages.has("/")).toBe(true);
  });

  it.each([...userPages.keys()].map((template) => [template]))(
    "%s は分類されている（unpublished ではない）",
    (template) => {
      const paths = concretePaths(template);
      expect(
        paths.length,
        "動的ルートを足したら route-policy.test.ts の DYNAMIC_ROUTE_SAMPLES に見本のパスを足すこと",
      ).toBeGreaterThan(0);
      for (const path of paths) {
        expect(
          getPublication(path, "ja"),
          `${path} が未分類。sitemap に載せるか、route-policy.ts の JA_NOINDEX_PATHS / JA_NOINDEX_PATTERNS に足すこと`,
        ).not.toBe("unpublished");
      }
    },
  );

  it.each([...userPages.keys()].map((template) => [template]))(
    "%s は sitemap に載るときだけ published-indexable",
    (template) => {
      for (const path of concretePaths(template)) {
        const expected: Publication =
          SITEMAP_PATHS.has(path) || template === "/announcements/[slug]"
            ? "published-indexable"
            : "published-noindex";
        expect(getPublication(path, "ja")).toBe(expected);
      }
    },
  );

  it("sitemap に載るパスはすべて実在のページに解決できる（分類の表に実在しないパスが無い）", () => {
    const realPaths = new Set(
      [...userPages.keys()].flatMap((template) => concretePaths(template)),
    );
    expect([...SITEMAP_PATHS].filter((path) => !realPaths.has(path))).toEqual(
      [],
    );
  });

  it.each([
    // ページの無いパス
    ["/nonexistent"],
    ["/practice/nonexistent"],
    ["/reference/glossary/nonexistent-term"],
    ["/dojo/ranks/nonexistent-rank"],
    // 末尾スラッシュ付き（Next が正規化した後のパスだけを扱う）
    ["/practice/"],
    // app/[locale] の外
    ["/admin"],
    ["/api/version"],
    ["/auth/callback"],
  ])("%s は日本語でも unpublished", (path) => {
    expect(getPublication(path, "ja")).toBe("unpublished");
  });

  it("query・hash は判定に影響しない", () => {
    expect(getPublication("/practice?x=1#y", "ja")).toBe(
      getPublication("/practice", "ja"),
    );
    expect(getPublication("/sign-in?next=/dojo", "ja")).toBe(
      "published-noindex",
    );
  });
});

describe("英語は許可リストで公開する", () => {
  it("フェーズ 1 で英語に公開するのは点数表だけ（索引させる）", () => {
    expect(EN_PUBLISHED_PATHS).toEqual(["/reference/score-table"]);
    expect(getPublication("/reference/score-table", "en")).toBe(
      "published-indexable",
    );
  });

  it.each([...userPages.keys()].map((template) => [template]))(
    "%s は許可リストに無ければ英語で unpublished（すべて英語にしてから noindex にする既定を持たない）",
    (template) => {
      for (const path of concretePaths(template)) {
        if (EN_PUBLISHED_PATHS.includes(path)) continue;
        expect(getPublication(path, "en")).toBe("unpublished");
      }
    },
  );

  it.each([
    ["/"],
    ["/dashboard"],
    ["/admin"],
    ["/api/version"],
    ["/auth/callback"],
    ["/english"],
    ["/reference/score-table/extra"],
    ["/reference/score-tables"],
  ])("%s は英語で unpublished", (path) => {
    expect(getPublication(path, "en")).toBe("unpublished");
  });

  it("英語で公開するページは日本語でも公開している実在のページ", () => {
    for (const path of EN_PUBLISHED_PATHS) {
      expect(userPages.has(path), `${path} の page.tsx が無い`).toBe(true);
      expect(isPublished(getPublication(path, "ja"))).toBe(true);
    }
  });

  it("英語の query 付きパスも同じ判定", () => {
    expect(getPublication("/reference/score-table?x=1#top", "en")).toBe(
      "published-indexable",
    );
  });
});

describe("isPublished", () => {
  it.each([
    ["unpublished", false],
    ["published-noindex", true],
    ["published-indexable", true],
  ] as const)("%s → %s", (publication, expected) => {
    expect(isPublished(publication)).toBe(expected);
  });
});
