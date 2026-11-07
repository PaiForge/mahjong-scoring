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
import { CURRICULUM } from "@mahjong-scoring/features/curriculum/registry";
import { PRACTICE_MENU_SLUGS } from "@mahjong-scoring/features/practice-menu-types";
import { RANK_SLUGS } from "@mahjong-scoring/features/ranks/registry";
import {
  AGARI_SCORE_PRACTICE_HREF,
  chapterHref,
  practiceHref,
  rankHref,
  TENPAI_SCORE_PRACTICE_HREF,
} from "@mahjong-scoring/features/routes";

import {
  EN_PUBLISHED_PATHS,
  getPublication,
  isPublished,
  type Publication,
} from "./route-policy";
import {
  translatedPublishedTemplates,
  translatedTemplateOf,
} from "./translated-publications";

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
  it("英語で公開するのは公開単位の表どおり", () => {
    const indexable = [
      "/",
      "/lessons",
      ...CURRICULUM.map((chapter) => chapterHref(chapter.slug)),
      "/reference",
      "/reference/yaku",
      "/reference/glossary",
      "/reference/score-table",
      "/practice",
      ...PRACTICE_MENU_SLUGS.map((slug) => practiceHref(slug)),
      AGARI_SCORE_PRACTICE_HREF,
      TENPAI_SCORE_PRACTICE_HREF,
      "/getting-started",
      "/try/agari-score",
      "/try/mentsu-fu",
      "/reference/demo",
      ...GLOSSARY_TERM_SLUGS.map(glossaryTermHref),
    ];
    const noindex = [
      ...PRACTICE_MENU_SLUGS.flatMap((slug) =>
        ["play", "training", "result"].map(
          (subpage) => `${practiceHref(slug)}/${subpage}`,
        ),
      ),
      `${AGARI_SCORE_PRACTICE_HREF}/play`,
      `${TENPAI_SCORE_PRACTICE_HREF}/play`,
      "/dojo",
      ...RANK_SLUGS.map(rankHref),
    ];
    expect([...EN_PUBLISHED_PATHS].sort()).toEqual(
      [...indexable, ...noindex].sort(),
    );
    for (const path of indexable) {
      expect(getPublication(path, "en"), path).toBe("published-indexable");
    }
    for (const path of noindex) {
      expect(getPublication(path, "en"), path).toBe("published-noindex");
    }
  });

  it("英語で索引させるページは日本語でも索引させる（英語だけの索引対象を作らない）", () => {
    for (const path of EN_PUBLISHED_PATHS) {
      if (getPublication(path, "en") !== "published-indexable") continue;
      expect(getPublication(path, "ja"), path).toBe("published-indexable");
    }
  });

  it("日本語で索引対象の道場・段級位の詳細は、英語では出すが索引させない（cookie を読む動的ページのため）", () => {
    for (const path of ["/dojo", ...RANK_SLUGS.map(rankHref)]) {
      expect(getPublication(path, "ja"), path).toBe("published-indexable");
      expect(getPublication(path, "en"), path).toBe("published-noindex");
    }
  });

  it("英語で公開するパスに重複が無い", () => {
    expect(new Set(EN_PUBLISHED_PATHS).size).toBe(EN_PUBLISHED_PATHS.length);
  });

  it.each(translatedPublishedTemplates("en").map((template) => [template]))(
    "公開テンプレート %s は具体的なパスへ展開される（展開の表の書き忘れが無い）",
    (template) => {
      const expanded = EN_PUBLISHED_PATHS.filter(
        (path) => translatedTemplateOf(path, "en") === template,
      );
      expect(expanded).toEqual(concretePaths(template));
      expect(expanded.length).toBeGreaterThan(0);
    },
  );

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
    ["/dashboard"],
    ["/sign-in"],
    ["/sign-up"],
    ["/mypage"],
    ["/leaderboard"],
    ["/plan"],
    ["/preferences"],
  ])("%s は英語で unpublished（日本語では公開している）", (path) => {
    expect(getPublication(path, "en")).toBe("unpublished");
    expect(isPublished(getPublication(path, "ja"))).toBe(true);
  });

  it.each([
    ["/dashboard"],
    ["/admin"],
    ["/api/version"],
    ["/auth/callback"],
    ["/english"],
    ["/reference/score-table/extra"],
    ["/reference/score-tables"],
    ["/reference/glossary/__unknown__"],
    ["/reference/glossary/jantou/extra"],
    ["/dojo/ranks/__unknown__"],
    ["/dojo/ranks"],
    ["/practice/nonexistent/play"],
  ])("%s は英語で unpublished", (path) => {
    expect(getPublication(path, "en")).toBe("unpublished");
  });

  it("英語で公開するページは日本語でも公開している実在のページ", () => {
    for (const path of EN_PUBLISHED_PATHS) {
      const template = translatedTemplateOf(path, "en") ?? path;
      expect(userPages.has(template), `${template} の page.tsx が無い`).toBe(
        true,
      );
      expect(isPublished(getPublication(path, "ja")), path).toBe(true);
    }
  });

  it("英語の query 付きパスも同じ判定", () => {
    expect(getPublication("/reference/score-table?x=1#top", "en")).toBe(
      "published-indexable",
    );
    expect(getPublication("/reference/glossary/jantou?x=1", "en")).toBe(
      "published-indexable",
    );
    expect(getPublication("/practice/jantou-fu/play?variant=all", "en")).toBe(
      "published-noindex",
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
