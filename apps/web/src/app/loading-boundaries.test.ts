import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { EN_PUBLISHED_PATHS } from "@/i18n/route-policy";
import { collectPageTemplates } from "@/test/collect-pages";
import {
  type BuildArtifacts,
  classifyRoute,
  readBuildArtifacts,
} from "../../scripts/seo-audit/_lib/build-artifacts";

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
 *   祖先の共通 loading.tsx は同じセグメント内の遷移（/lessons → /lessons/x 等）で
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
 * ビルド成果物と突き合わせる（build を必須にするゲートは `scripts/seo-audit/build.ts`。
 * こちらは build の無い単体テストの実行でも走るため、成果物が無ければ突き合わせだけ飛ばす）。
 *
 * ルートはロケール非依存のテンプレート（`app/[locale]/(user)/(public)/practice` →
 * `/practice`）で数える。loading.tsx は物理的な page.tsx の祖先に置くもので、
 * 1 枚の page.tsx が `/ja/practice` と `/en/practice` の両方を描くため。
 * 静的 / 動的は日本語（既定の言語）のルートで決める。英語は公開したページ
 * だけが描かれ、それ以外は not-found の成果物になるので、通常のページの
 * 分類とは別に後段で検査する。ページの動的 / 静的が変わったら（cookie を読み
 * 始めた・searchParams を使った・`force-dynamic` を付けた等）この一覧と
 * loading.tsx の有無を一緒に直すこと。
 *
 * 上の挙動を再検証するとき（Next を上げたとき等）:
 * - 初期 HTML は `pnpm build` 後の `.next/server/app/<route>.html` の `<main>` を直接見る。
 *   `<!--$?-->` / `$RC(` / `<div hidden id="S:…">` があれば本文は外出しされている
 *   （同じ応答の末尾にあり、別 fetch ではない）
 * - 境界の入れ子は `curl -sL -H 'RSC: 1' -H 'Next-Router-Prefetch: 1' -H 'Next-Url: /' <URL>` の
 *   prefetch payload にルート固有のスケルトンのクラスが含まれるかで見る（server loading だけ。
 *   client loading は参照しか入らない）
 * - 体感は `next start` にブラウザ自動化で MutationObserver を仕込み、click 後の
 *   `.animate-pulse` の数の推移を記録する。遅いサーバーを模すときは対象ルートの RSC 応答だけを
 *   遅らせる — 全 RSC を遅らせると静的リンクの prefetch が渋滞して誤った結論になる
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
  "/admin/ads",
  "/admin/ads/[id]/edit",
  "/admin/ads/links",
  "/admin/ads/new",
  "/admin/announcements",
  "/admin/announcements/[id]/edit",
  "/admin/announcements/new",
  "/admin/audit-log",
  "/admin/benefit-grants",
  "/admin/reports",
  "/admin/reports/[id]",
  "/admin/users",
  "/admin/users/[id]",
  "/announcements",
  "/announcements/[slug]",
  "/banned",
  "/contact/confirm",
  "/dashboard",
  "/dojo",
  "/dojo/ranks/[slug]",
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
  "/lessons",
  "/mypage",
  "/mypage/account",
  "/mypage/account/delete",
  "/mypage/challenges",
  "/mypage/challenges/results",
  "/mypage/notifications",
  "/mypage/plan",
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
  const pages = collectPageTemplates(APP_DIR);

  it("page.tsx が見つかる（テスト自体の健全性）", () => {
    expect(pages.size).toBeGreaterThan(0);
  });

  it("DYNAMIC_ROUTES はすべて実在するページを指す", () => {
    for (const route of DYNAMIC_ROUTES) {
      expect(pages.has(route), `${route} に page.tsx が無い`).toBe(true);
    }
  });

  it.each([...pages.entries()].map(([route, page]) => [route, page.file]))(
    "%s の loading.tsx は動的なら 1 枚・静的なら 0 枚",
    (route, file) => {
      const boundaries = findLoadingBoundaries(dirname(file));
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
 *
 * prerender manifest のキーはロケールを展開した後の実パス（`/ja/practice`）で、
 * 生成元の app route（`srcRoute`）は `/[locale]/practice`。app route の単位で
 * 「プリレンダーがあるか」を見ると、英語の not-found の成果物だけを持つ動的
 * ルート（`/[locale]/announcements` は `/en/announcements` だけが 404 として
 * プリレンダーされる）を静的と誤認するので、言語ごとに数える（分類の実装は
 * `scripts/seo-audit/_lib/build-artifacts.ts`。build の監査と同じもの）。
 */
describe("DYNAMIC_ROUTES とビルド成果物", () => {
  const nextDir = join(APP_DIR, "..", "..", ".next");
  const appPathRoutes = join(nextDir, "app-path-routes-manifest.json");
  const prerender = join(nextDir, "prerender-manifest.json");
  const hasBuild = existsSync(appPathRoutes) && existsSync(prerender);
  const pages = collectPageTemplates(APP_DIR);
  const loadArtifacts = (): BuildArtifacts =>
    readBuildArtifacts(
      prerender,
      appPathRoutes,
      join(nextDir, "server", "app"),
    );

  it.skipIf(!hasBuild)(
    "route table の動的ページと一致する（日本語で数える）",
    () => {
      const artifacts = loadArtifacts();
      const built = new Set<string>();
      for (const page of pages.values()) {
        const locale = page.localized ? "ja" : undefined;
        if (
          classifyRoute(artifacts, page.appRoute, locale).kind === "dynamic"
        ) {
          built.add(page.template);
        }
      }
      const missing = [...built].filter((route) => !DYNAMIC_ROUTES.has(route));
      const stale = [...DYNAMIC_ROUTES].filter((route) => !built.has(route));
      expect(
        missing,
        `動的にビルドされたのに DYNAMIC_ROUTES に無いルート → DYNAMIC_ROUTES に足し、leaf に loading.tsx を 1 枚置く: ${missing.join(", ")}`,
      ).toEqual([]);
      expect(
        stale,
        `DYNAMIC_ROUTES にあるのに静的にプリレンダリングされたルート → DYNAMIC_ROUTES から外し、loading.tsx を消す: ${stale.join(", ")}`,
      ).toEqual([]);
      expect([...built].sort()).toEqual([...DYNAMIC_ROUTES].sort());
    },
  );

  it.skipIf(!hasBuild)(
    "generateStaticParams で列挙するルートは日本語で 1 件以上プリレンダーされる",
    () => {
      const artifacts = loadArtifacts();
      const empty = [...pages.values()]
        .filter(
          (page) =>
            classifyRoute(
              artifacts,
              page.appRoute,
              page.localized ? "ja" : undefined,
            ).kind === "ssg-empty",
        )
        .map((page) => page.template);
      expect(
        empty,
        `generateStaticParams が日本語で 0 件を返し、日本語のページが 1 枚も無いルート: ${empty.join(", ")}`,
      ).toEqual([]);
    },
  );

  it.skipIf(!hasBuild)(
    "英語は公開したページだけが 200 で静的生成され、他は not-found の成果物か描画されない",
    () => {
      const artifacts = loadArtifacts();
      const published = new Set(EN_PUBLISHED_PATHS);
      const unexpected: string[] = [];
      const notStatic: string[] = [];
      for (const page of pages.values()) {
        if (!page.localized) continue;
        const { kind, ok } = classifyRoute(artifacts, page.appRoute, "en");
        const okPaths = ok.map((route) => route.key.slice("/en".length) || "/");
        unexpected.push(...okPaths.filter((path) => !published.has(path)));
        if (published.has(page.template) && kind !== "static") {
          notStatic.push(`${page.template}（${kind}）`);
        }
      }
      expect(
        unexpected,
        `英語で未公開なのに 200 で静的生成されたページ: ${unexpected.join(", ")}`,
      ).toEqual([]);
      expect(
        notStatic,
        `英語で公開したのに 200 で静的生成されていないページ: ${notStatic.join(", ")}`,
      ).toEqual([]);
    },
  );
});
