import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { INDEXABLE_PATHS } from "@/app/_lib/sitemap-routes";
import { isPracticeMenuSlug } from "@/lib/db/practice-menu-types";

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
 * 分類に失敗したら: sitemap-routes.ts に載せて canonical を付けるか、
 * noindex 系ヘルパー（createPracticePlayMetadata / createPrivateMetadata 等）を
 * 使うか、このファイルの EXCLUDED_PATHS に理由付きで追加すること。
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
  ["/leaderboard", "sitemap 掲載は判断保留（掲載するなら canonical も付ける）"],
]);

/** ページソースにこれが含まれていれば noindex（検索除外）を宣言しているとみなす */
const NOINDEX_MARKERS = [
  "createPracticePlayMetadata(",
  "createPracticeTrainingMetadata(",
  "createPracticeResultMetadata(",
  "createPrivateMetadata(",
  "robots: { index: false",
] as const;

/** src/app 配下の全 page.tsx を「URL パス → ファイルパス」で収集する */
function collectPages(dir: string): Map<string, string> {
  const pages = new Map<string, string>();
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        walk(join(current, entry.name));
      } else if (entry.name === "page.tsx") {
        const segments = relative(dir, current)
          .split(sep)
          // route group（(user) 等）と _ プレフィックスは URL に現れない
          .filter((seg) => !seg.startsWith("(") && !seg.startsWith("_"));
        // ルート直下（segments が空）は "/" になる
        pages.set(`/${segments.join("/")}`, join(current, "page.tsx"));
      }
    }
  };
  walk(dir);
  return pages;
}

/** ページソースが urlPath への canonical を宣言しているか */
function declaresCanonical(source: string, urlPath: string): boolean {
  if (urlPath === "/") {
    return source.includes('canonical: "/"');
  }
  const learnMatch = /^\/learn\/([^/]+)$/.exec(urlPath);
  if (learnMatch) {
    return source.includes(`createLearnMetadata("${learnMatch[1]}")`);
  }
  const practiceMatch = /^\/practice\/([^/]+)$/.exec(urlPath);
  if (practiceMatch && isPracticeMenuSlug(practiceMatch[1])) {
    return source.includes(`createPracticeMetadata("${practiceMatch[1]}")`);
  }
  // path オプション（path: "/x"）と createTitleOnlyMetadata の第 3 引数
  // （, "/x"）の両方を受ける
  return new RegExp(`(path:\\s*|,\\s*)"${urlPath}"`).test(source);
}

describe("SEO カバレッジ", () => {
  const pages = collectPages(APP_DIR);

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
      // 動的セグメントは対象外（canonical / noindex を自前で条件分岐するため
      // ページ単位で管理する。announcements/[slug] は DB 由来で sitemap に載る）
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
});
