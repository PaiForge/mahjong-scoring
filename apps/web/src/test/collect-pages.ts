import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * App Router の page.tsx を「URL パス → page.tsx のファイルパス」で集める
 * ページ収集
 *
 * ルート構成を検査するテスト（loading 境界・SEO カバレッジ）が、同じ
 * 「ディレクトリ → URL」の対応で page.tsx を引くための唯一の実装。
 * route group（`(user)` 等）は URL に現れないのでセグメントだけ落とす。
 * `_` プレフィックスのディレクトリ（private folder）は配下ごとルーティングの
 * 対象外なので降りない。`dir` 直下の page.tsx は `/` になる。
 *
 * キーは Next の app route そのもの（`app/[locale]` 配下は `/[locale]/practice`）。
 * ロケール非依存のパスで引きたいときは {@link collectPageTemplates} を使う。
 *
 * @param dir - `src/app` の絶対パス
 */
export function collectPages(dir: string): Map<string, string> {
  const pages = new Map<string, string>();
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith("_")) {
          continue;
        }
        walk(join(current, entry.name));
      } else if (entry.name === "page.tsx") {
        const segments = relative(dir, current)
          .split(sep)
          .filter((seg) => seg !== "" && !seg.startsWith("("));
        pages.set(`/${segments.join("/")}`, join(current, "page.tsx"));
      }
    }
  };
  walk(dir);
  return pages;
}

/** `app/[locale]` のディレクトリが app route に足す先頭のセグメント */
export const LOCALE_SEGMENT = "[locale]";

/**
 * 物理的な page.tsx 1 枚（ロケールに展開する前）
 *
 * `app/[locale]` 配下の 1 枚は、公開 URL では言語の数だけのルートになる。
 * ここではまだ 1 枚のまま持ち、言語への展開は {@link expandLocaleRoutes} が
 * 別のデータとして作る（同じ Map にロケール付きのキーを混ぜると、片方の
 * 書き込みがもう片方を上書きして ja / en のどちらかを失う）。
 */
export interface PageTemplate {
  /** page.tsx の絶対パス */
  readonly file: string;
  /** Next の app route（route group 除去済み。`/[locale]/practice`・`/admin`） */
  readonly appRoute: string;
  /**
   * ロケール非依存のパスのテンプレート（`/practice`・`/reference/glossary/[slug]`）
   *
   * 先頭の `[locale]` だけを外す。それ以外の動的セグメントは残す — 外すと
   * `/dojo/ranks/[slug]` と `/dojo/ranks` が同じキーになる。
   * `app/[locale]` の外（`/admin` 等）は app route と同じ。
   */
  readonly template: string;
  /** `app/[locale]` 配下（言語ごとの公開ルートを持つ）か */
  readonly localized: boolean;
}

/**
 * app route をロケール非依存のテンプレートに直す
 *
 * `/[locale]` → `/`、`/[locale]/practice` → `/practice`。先頭が `[locale]` で
 * なければそのまま返す（途中の `[locale]` という名前のセグメントは扱わない）。
 *
 * @param appRoute - route group 除去済みの app route
 */
export function stripLocaleSegment(appRoute: string): {
  readonly template: string;
  readonly localized: boolean;
} {
  const head = `/${LOCALE_SEGMENT}`;
  if (appRoute === head) return { template: "/", localized: true };
  if (appRoute.startsWith(`${head}/`)) {
    return { template: appRoute.slice(head.length), localized: true };
  }
  return { template: appRoute, localized: false };
}

/**
 * page.tsx を「ロケール非依存のテンプレート → 物理ページ」で集める
 * ページテンプレート収集
 *
 * `app/[locale]/(user)/(public)/practice/page.tsx` は `/practice`、
 * `app/admin/page.tsx` は `/admin` になる。`[locale]` の内と外で同じ
 * テンプレートになるページがあれば（`app/admin` と `app/[locale]/admin` 等）、
 * 黙って上書きせずに例外にする — どちらの検査対象が消えたか分からなくなるため。
 *
 * @param dir - `src/app` の絶対パス
 * @throws 2 枚の page.tsx が同じテンプレートに解決したとき
 */
export function collectPageTemplates(dir: string): Map<string, PageTemplate> {
  const templates = new Map<string, PageTemplate>();
  for (const [appRoute, file] of collectPages(dir)) {
    const { template, localized } = stripLocaleSegment(appRoute);
    const existing = templates.get(template);
    if (existing) {
      throw new Error(
        `同じテンプレート ${template} に 2 枚の page.tsx が解決した: ${existing.file} / ${file}`,
      );
    }
    templates.set(template, { file, appRoute, template, localized });
  }
  return templates;
}

/** 言語に展開した公開ルート 1 本 */
export interface LocaleRoute {
  readonly locale: string;
  /** ロケール非依存のテンプレート（`/practice`） */
  readonly template: string;
  /** Next の内部パス（`/ja/practice`・`/en`）。build の成果物のキーと同じ形 */
  readonly internalPath: string;
  /**
   * 公開 URL のパス（既定の言語は接頭辞なしの `/practice`、他は `/en/practice`）
   *
   * 既定の言語のトップは `/`、他の言語のトップは `/en`。
   */
  readonly publicPath: string;
  /** 元の物理ページ */
  readonly page: PageTemplate;
}

/**
 * `app/[locale]` 配下のページを、言語ごとの公開ルートに展開する
 * ロケールルート展開
 *
 * 1 枚の page.tsx から言語の数だけの {@link LocaleRoute} を作る（配列で返し、
 * Map の上書きで言語を失わない）。`[locale]` の外のページは展開しない。
 * 動的セグメント（`[slug]`）はテンプレートのまま残す — 具体的な値への展開は
 * レジストリや DB を知る呼び出し側の仕事。
 *
 * @param templates - {@link collectPageTemplates} の結果
 * @param locales - 展開する言語（先頭が既定の言語。接頭辞なしの公開 URL を持つ）
 */
export function expandLocaleRoutes(
  templates: ReadonlyMap<string, PageTemplate>,
  locales: readonly string[],
): LocaleRoute[] {
  const [defaultLocale] = locales;
  const routes: LocaleRoute[] = [];
  for (const page of templates.values()) {
    if (!page.localized) continue;
    for (const locale of locales) {
      const suffix = page.template === "/" ? "" : page.template;
      const internalPath = `/${locale}${suffix}`;
      const publicPath =
        locale === defaultLocale ? page.template : internalPath;
      routes.push({
        locale,
        template: page.template,
        internalPath,
        publicPath,
        page,
      });
    }
  }
  return routes;
}
