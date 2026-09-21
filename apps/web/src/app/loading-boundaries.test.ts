import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * ローディング境界の不変条件:
 *
 * - **動的ルート**（サーバーが要求ごとに描画するページ）は、祖先に loading.tsx を
 *   ちょうど 1 つだけ持つ
 * - **静的ルート**（ビルド時にプリレンダリングされるページ）は loading.tsx を持たない
 *
 * 動的ルートに境界が要る理由:
 * - 0 枚だと、クライアント遷移でプリフェッチに見せるものが無く、サーバ応答が返る
 *   までクリックが無反応になる
 * - 2 枚以上だと Suspense 境界が入れ子になり、Link のプリフェッチは最も外側の
 *   境界までしか取らないため、内側の個別スケルトンは「速いサーバでは一度も
 *   出ない / 遅いサーバでは本文直前に一瞬だけ出る」状態になる（2026-08 に実測）
 * - 境界は「遷移時に新しくマウントされるスロット」に無いとフォールバックが出ない。
 *   React は遷移中、既にマウント済みの Suspense のフォールバックを出さないため、
 *   祖先の共通 loading.tsx は同じセグメント内の遷移（/learn → /learn/x 等）で
 *   効かず、クリックが無反応になる（2026-08 に実測）。よって境界は leaf
 *   （page.tsx と同じディレクトリか、配下に他の loading.tsx を持たない最小の祖先）に置く。
 *   index ページだけに境界が要る場合は、page.tsx と loading.tsx を route group に
 *   退避して兄弟ルートの祖先にならないようにする（`mypage/(home)`, `admin/(dashboard)`）
 *
 * 静的ルートに境界を置かない理由:
 * - loading.tsx はページ全体を包む Suspense 境界で、React（Fizz）は完了済みの境界でも
 *   中身が `progressiveChunkSize`（12.8KB、既に流したバイト数との累計）を超えると
 *   fallback を先に書き、本文を応答末尾の `<div hidden>` + `$RC()` に回す。これは
 *   静的生成の HTML にもそのまま焼き込まれるため、境界を持つ静的ページは初期 HTML の
 *   `<main>` がスケルトンだけになる（2026-09 に本番で実測。JS を実行しない
 *   クローラーや SNS のプレビューには本文が見えず、空の見出しが本物より先に出る）
 * - 静的ルートは Link が全量プリフェッチするので、遷移スケルトンはそもそも出ない。
 *   境界を外して失うのは「プリフェッチが間に合わなかったときのスケルトン」だけ
 *
 * どのルートが動的かは `next build` の route table（ƒ）が権威で、ここでは
 * {@link DYNAMIC_ROUTES} に写している。`.next` があるときは後段のテストが
 * ビルド成果物と突き合わせる。ページの動的 / 静的が変わったら（cookie を読み
 * 始めた・searchParams を使った・`force-dynamic` を付けた等）この一覧と
 * loading.tsx の有無を一緒に直すこと。
 */
const APP_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * サーバーが要求ごとに描画するページの URL パス（`next build` の route table で ƒ のもの）
 *
 * `generateStaticParams` で列挙する SSG（`/reference/glossary/[slug]` 等）は静的として扱う。
 */
const DYNAMIC_ROUTES: ReadonlySet<string> = new Set([
  "/admin",
  "/admin/activity-log",
  "/admin/announcements",
  "/admin/announcements/[id]/edit",
  "/admin/announcements/new",
  "/admin/audit-log",
  "/admin/users",
  "/announcements",
  "/announcements/[slug]",
  "/banned",
  "/contact/confirm",
  "/dashboard",
  "/dojo",
  "/exam/chiitoitsu/play",
  "/exam/chiitoitsu/result",
  "/exam/fu-score/play",
  "/exam/fu-score/result",
  "/exam/fu/play",
  "/exam/fu/result",
  "/exam/mangan/play",
  "/exam/mangan/result",
  "/exam/pinfu/play",
  "/exam/pinfu/result",
  "/exam/score/play",
  "/exam/score/result",
  "/leaderboard",
  "/leaderboard/[period]/[module]",
  "/learn",
  "/learn/about-this-app",
  "/learn/chiitoitsu-score",
  "/learn/fu-doubling",
  "/learn/furo-score",
  "/learn/jantou-fu",
  "/learn/machi-fu",
  "/learn/mangan-ko-ron",
  "/learn/mangan-ko-tsumo",
  "/learn/mangan-oya-ron",
  "/learn/mangan-oya-tsumo",
  "/learn/mentsu-fu",
  "/learn/menzen-mentsu-score",
  "/learn/pinfu-score",
  "/learn/ron-to-tsumo",
  "/learn/tehai-fu",
  "/learn/tsumo-payments",
  "/learn/why-scoring-is-complex",
  "/learn/yaku",
  "/mypage",
  "/mypage/account/delete",
  "/mypage/challenges",
  "/mypage/challenges/results",
  "/mypage/profile/edit",
  "/mypage/setup-username",
  "/practice/han-count/result",
  "/practice/jantou-fu/result",
  "/practice/machi-fu/result",
  "/practice/mangan-score-calculation/result",
  "/practice/mentsu-fu/result",
  "/practice/mentsu-jantou-fu/result",
  "/practice/score-calculation/result",
  "/practice/score-table/result",
  "/practice/total-fu/result",
  "/practice/yaku-han/result",
  "/practice/yaku/result",
  "/sign-in",
  "/sign-up",
  "/sign-up/verify-email",
  "/u/[username]",
]);

/** src/app 配下の page.tsx を「URL パス → ディレクトリ」で集める */
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
          .filter((seg) => seg !== "" && !seg.startsWith("("));
        pages.set(`/${segments.join("/")}`, current);
      }
    }
  };
  walk(dir);
  return pages;
}

/** page のディレクトリから src/app までを遡り、loading.tsx を持つディレクトリを返す */
function findLoadingBoundaries(pageDir: string): string[] {
  const boundaries: string[] = [];
  let current = pageDir;
  for (;;) {
    if (existsSync(join(current, "loading.tsx"))) {
      boundaries.push(relative(APP_DIR, join(current, "loading.tsx")));
    }
    if (current === APP_DIR) break;
    current = dirname(current);
  }
  return boundaries;
}

describe("loading.tsx の境界", () => {
  const pages = collectPages(APP_DIR);

  it("page.tsx が見つかる（テスト自体の健全性）", () => {
    expect(pages.size).toBeGreaterThan(0);
  });

  it("DYNAMIC_ROUTES はすべて実在するページを指す", () => {
    for (const route of DYNAMIC_ROUTES) {
      expect(pages.has(route), `${route} に page.tsx が無い`).toBe(true);
    }
  });

  it.each([...pages.entries()].map(([route, dir]) => [route, dir]))(
    "%s の loading.tsx は動的なら 1 枚・静的なら 0 枚",
    (route, dir) => {
      const boundaries = findLoadingBoundaries(dir);
      const expected = DYNAMIC_ROUTES.has(route) ? 1 : 0;
      expect(
        boundaries,
        expected === 1
          ? `動的ルートは loading.tsx を 1 枚だけ持つ（現在: ${boundaries.length} 枚）`
          : `静的ルートは loading.tsx を持たない（初期 HTML の <main> が空になる）。現在: ${boundaries.join(", ")}`,
      ).toHaveLength(expected);
    },
  );
});

/**
 * ビルド成果物との突き合わせ
 *
 * `pnpm build` 後に `.next/` があるときだけ走る。route table の ƒ（動的）と
 * {@link DYNAMIC_ROUTES} がずれていれば、ページの動的 / 静的が変わったのに
 * 一覧（と loading.tsx の有無）が追随していない。
 */
describe("DYNAMIC_ROUTES とビルド成果物", () => {
  const nextDir = join(APP_DIR, "..", "..", ".next");
  const appPathRoutes = join(nextDir, "app-path-routes-manifest.json");
  const prerender = join(nextDir, "prerender-manifest.json");
  const hasBuild = existsSync(appPathRoutes) && existsSync(prerender);

  it.skipIf(!hasBuild)("route table の動的ページと一致する", () => {
    const routes = JSON.parse(readFileSync(appPathRoutes, "utf8")) as Record<
      string,
      string
    >;
    const manifest = JSON.parse(readFileSync(prerender, "utf8")) as {
      readonly routes: Record<string, unknown>;
      readonly dynamicRoutes: Record<string, unknown>;
    };
    const pageRoutes = Object.entries(routes)
      .filter(([source]) => source.endsWith("/page"))
      .map(([, route]) => route);
    const built = new Set(
      pageRoutes.filter(
        (route) =>
          !(route in manifest.routes) && !(route in manifest.dynamicRoutes),
      ),
    );
    expect([...built].sort()).toEqual([...DYNAMIC_ROUTES].sort());
  });
});
