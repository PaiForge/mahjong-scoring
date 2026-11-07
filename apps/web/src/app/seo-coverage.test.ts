import { readFileSync } from "node:fs";
import { dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { collectPageTemplates } from "@/test/collect-pages";

import {
  GLOSSARY_SITEMAP_PATHS,
  INDEXABLE_PATHS,
  RANK_SITEMAP_PATHS,
} from "@/app/_lib/sitemap-routes";
import { EN_PUBLISHED_PATHS } from "@/i18n/route-policy";
import { PLAN_PAGE_HREF } from "@mahjong-scoring/features/billing/plans";
import {
  PRACTICE_SLUG,
  PRACTICE_MENU_SLUGS,
  practiceMenuBySlug,
} from "@mahjong-scoring/features/practice-menu-types";
import * as routes from "@mahjong-scoring/features/routes";

/**
 * SEO カバレッジの不変条件（loading-boundaries.test.ts と同型の構造検査）:
 *
 * 1. sitemap（sitemap-routes.ts）に載る全パスは実在する page.tsx に解決できる
 *    — ルート改名で sitemap だけ残ると 404 を Google に配ることになる
 * 2. sitemap に載るページは自分のパスと一致する canonical を宣言している
 *    — canonical はヘルパーに path / slug を手渡しする設計のため、
 *      付け漏れ・張り間違いはコンパイルでは落ちない
 * 3. `(user)` 配下の公開ページは「sitemap 掲載」「noindex」「除外理由の明示」の
 *    いずれかに必ず分類される — 新規ページが無分類のまま出荷されるのを防ぐ
 *
 * 4. 動的セグメントで受けるページ（`[slug]` 等）は {@link DYNAMIC_TEMPLATES} に
 *    扱いを明示する — 3 の分類は静的なパスでしか判定できないので、明示が無いと
 *    新しい動的ページが無検査で出荷される
 * 5. 英語で公開するパス（`route-policy.ts` の許可リスト）は `app/[locale]` 配下の
 *    実在する page.tsx に解決できる
 *
 * 分類に失敗したら: sitemap-routes.ts に載せて canonical を付けるか、
 * noindex 系ヘルパー（createPracticePlayMetadata / createPrivateMetadata 等）を
 * 使うか、このファイルの EXCLUDED_PATHS に理由付きで追加すること。
 *
 * ページはロケール非依存のテンプレートで引く（`app/[locale]/(user)/(public)/company` →
 * `/company`）。sitemap のパスもテンプレートもロケール接頭辞を持たない形なので、
 * そのまま突き合わせられる。`[locale]` を残したキー（`/[locale]/company`）で引くと、
 * すべてのページが「動的セグメントを含む」側に落ちて検査されなくなる。
 * 実際の HTML の canonical・hreflang・robots は build の監査
 * （`scripts/seo-audit/build.ts`）が成果物で確かめる。ここはソースの構造検査。
 */
const APP_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * sitemap に載せず index もさせないが、noindex ヘルパーも使っていないページ。
 * 追加するときは必ず理由を書くこと。
 */
const EXCLUDED_PATHS: ReadonlyMap<string, string> = new Map([
  ["/banned", "BAN 通知。metadata 自体を持たない"],
  ["/forgot-password", "認証フロー。検索流入の受け皿にしない"],
  ["/reset-password", "認証フロー（メールのリンクからのみ遷移）"],

  ["/sign-in", "認証フロー"],
  ["/sign-up", "認証フロー"],
  ["/sign-up/verify-email", "認証フロー（登録直後のみ意味を持つ）"],
  ["/preferences", "ユーザー個別設定。sitemap 掲載は判断保留"],
  ["/preferences/yaku-order", "ユーザー個別設定（設定の子ページ）"],
]);

/**
 * 動的セグメントで受けるページの扱い（テンプレート → 理由）
 *
 * 3 の分類は静的なパスでしか判定できないので、動的ページはここで扱いを明示する。
 * 動的ページを足したらここに足す（無ければテストが落ちる）。
 */
const DYNAMIC_TEMPLATES: ReadonlyMap<string, string> = new Map([
  [
    "/announcements/[slug]",
    "DB 由来。sitemap.ts が公開済みの slug を実行時に引き、ページが canonical を持つ",
  ],
  [
    "/reference/glossary/[slug]",
    "用語レジストリの全 slug を sitemap に載せる（GLOSSARY_SITEMAP_PATHS）",
  ],
  [
    "/dojo/ranks/[slug]",
    "段級位レジストリの全 slug を sitemap に載せる（RANK_SITEMAP_PATHS）",
  ],
  [
    "/leaderboard/[period]/[module]",
    "ランキングの詳細。sitemap に載せない（期間 × 練習の組み合わせ）",
  ],
  ["/u/[username]", "公開プロフィール。robots で除外（ソフト 404 対策）"],
]);

/** 動的セグメントを含むテンプレートを、具体的なパスに当てる正規表現にする */
function templatePattern(template: string): RegExp {
  const source = template
    .split("/")
    .map((segment) =>
      /^\[[^\]]+\]$/.test(segment)
        ? "[^/]+"
        : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("/");
  return new RegExp(`^${source}$`);
}

/** ページソースにこれが含まれていれば noindex（検索除外）を宣言しているとみなす */
const NOINDEX_MARKERS = [
  "createPracticePlayMetadata(",
  "createFreePracticePlayMetadata(",
  "createPracticeTrainingMetadata(",
  "createPracticeResultMetadata(",
  "createPrivateMetadata(",
  "robots: { index: false",
] as const;

/** ページソースが urlPath への canonical を宣言しているか */
function declaresCanonical(source: string, urlPath: string): boolean {
  if (urlPath === "/") {
    return source.includes('canonical: "/"');
  }
  const lessonMatch = /^\/lessons\/([^/]+)$/.exec(urlPath);
  if (lessonMatch) {
    // 第 2 引数（`{ locale }`）があってもよいが、第 1 引数は自分の slug の
    // 文字列そのものに限る（別の章の slug の写し間違いを通さない）
    const slug = lessonMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      String.raw`createLearnMetadata\(\s*"${slug}"\s*[,)]`,
    ).test(source);
  }
  // 練習の説明ページ: URL はレジストリの basePath（/exam 配下の昇級試験を含む）
  // から引くため、/practice/ 前置きの正規表現ではなく basePath の逆引きで判定する
  const practiceSlug = PRACTICE_MENU_SLUGS.find(
    (slug) => practiceMenuBySlug(slug).basePath === urlPath,
  );
  if (practiceSlug) {
    const slugKey = Object.entries(PRACTICE_SLUG).find(
      ([, slug]) => slug === practiceSlug,
    )?.[0];
    return (
      source.includes(`createPracticeMetadata("${practiceSlug}")`) ||
      (slugKey !== undefined &&
        source.includes(`createPracticeMetadata(PRACTICE_SLUG.${slugKey})`))
    );
  }
  // path オプション（path: "/x"）と createTitleOnlyMetadata の第 3 引数
  // （, "/x"）の両方を受ける。パスは文字列でも、features の定数
  // （`LESSONS_PATH` 等。値がこのパスのもの）で渡していてもよい
  const pathTokens = [
    `"${urlPath}"`,
    ...pathConstantNames(urlPath).map((name) => `${name}\\b`),
  ];
  return new RegExp(`(path:\\s*|,\\s*)(${pathTokens.join("|")})`).test(source);
}

/** 値が urlPath と一致する、パスの定数の名前（`routes.ts` と `PLAN_PAGE_HREF`） */
function pathConstantNames(urlPath: string): readonly string[] {
  const constants: Record<string, unknown> = { ...routes, PLAN_PAGE_HREF };
  return Object.entries(constants)
    .filter(([, value]) => value === urlPath)
    .map(([name]) => name);
}

describe("SEO カバレッジ", () => {
  const templates = collectPageTemplates(APP_DIR);
  const pages: ReadonlyMap<string, string> = new Map(
    [...templates].map(([template, page]) => [template, page.file]),
  );
  const dynamicTemplates = [...templates.values()].filter((page) =>
    page.template.includes("["),
  );

  it("page.tsx が見つかる（テスト自体の健全性）", () => {
    expect(pages.size).toBeGreaterThan(0);
  });

  it("sitemap のパスに重複が無い", () => {
    expect(new Set(INDEXABLE_PATHS).size).toBe(INDEXABLE_PATHS.length);
  });

  describe.each(INDEXABLE_PATHS.map((path) => [path]))("%s", (urlPath) => {
    it("実在する page.tsx に解決できる", () => {
      expect(
        pages.get(urlPath),
        "sitemap-routes.ts に載っているが対応する page.tsx が無い",
      ).toBeDefined();
    });

    it("自分のパスと一致する canonical を宣言している", () => {
      const file = pages.get(urlPath);
      if (!file) return; // 上のケースで失敗している
      expect(
        declaresCanonical(readFileSync(file, "utf-8"), urlPath),
        `canonical が無いか、別のパスを指している（期待: ${urlPath}）`,
      ).toBe(true);
    });
  });

  const publicPages = [...pages.entries()].filter(([, file]) =>
    file.includes(`${sep}(user)${sep}`),
  );

  it.each(publicPages.map(([urlPath]) => [urlPath]))(
    "%s は sitemap 掲載 / noindex / 除外理由の明示のいずれかに分類される",
    (urlPath) => {
      // 動的セグメントは DYNAMIC_TEMPLATES で扱いを明示する（下のテスト）
      if (urlPath.includes("[")) return;
      if (INDEXABLE_PATHS.includes(urlPath)) return;
      if (EXCLUDED_PATHS.has(urlPath)) return;

      const source = readFileSync(pages.get(urlPath) ?? "", "utf-8");
      expect(
        NOINDEX_MARKERS.some((marker) => source.includes(marker)),
        "sitemap-routes.ts に載せて canonical を付けるか、noindex 系ヘルパーを使うか、" +
          "seo-coverage.test.ts の EXCLUDED_PATHS に理由付きで追加すること",
      ).toBe(true);
    },
  );

  it.each(
    dynamicTemplates
      .filter((page) => page.file.includes(`${sep}(user)${sep}`))
      .map((page) => [page.template]),
  )("動的ページ %s は DYNAMIC_TEMPLATES に扱いが明示されている", (template) => {
    expect(
      DYNAMIC_TEMPLATES.has(template),
      "seo-coverage.test.ts の DYNAMIC_TEMPLATES に、sitemap・canonical・noindex の扱いを理由付きで足すこと",
    ).toBe(true);
  });

  it("DYNAMIC_TEMPLATES はすべて実在する動的ページを指す", () => {
    const stale = [...DYNAMIC_TEMPLATES.keys()].filter(
      (template) => !pages.has(template),
    );
    expect(stale, `page.tsx の無いテンプレート: ${stale.join(", ")}`).toEqual(
      [],
    );
  });

  it.each(
    [...GLOSSARY_SITEMAP_PATHS, ...RANK_SITEMAP_PATHS].map((path) => [path]),
  )("sitemap の動的ページ %s は実在する動的ページに解決できる", (path) => {
    const matched = dynamicTemplates.filter((page) =>
      templatePattern(page.template).test(path),
    );
    expect(
      matched.map((page) => page.template),
      "sitemap-routes.ts に載っているが、受ける動的ページ（[slug]）が無い",
    ).toHaveLength(1);
  });

  it.each(EN_PUBLISHED_PATHS.map((path) => [path]))(
    "英語で公開する %s は app/[locale] 配下の実在する page.tsx に解決できる",
    (path) => {
      const page = templates.get(path);
      expect(
        page,
        "route-policy.ts の英語の許可リストにあるが page.tsx が無い",
      ).toBeDefined();
      expect(page?.localized).toBe(true);
    },
  );
});
