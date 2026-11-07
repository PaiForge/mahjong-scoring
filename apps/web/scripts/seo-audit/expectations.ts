/**
 * SEO 監査の期待値（移行前後で守るものと、意図して変えるもの）
 *
 * 監査（`build.ts` / `http.ts`）は、アプリの公開状態のモジュール
 * （`src/i18n/route-policy.ts`・`seo-alternates.ts`）を import せず、ここに
 * 期待値を独立に持つ。理由は 2 つ:
 *
 * - 監査は「アプリが出したもの」を外から確かめる検査で、出力を組んだのと同じ
 *   コードを期待値に使うと、そのコードの誤りを見逃す
 * - アプリのモジュールは ESM 専用の依存（`@pai-forge/riichi-mahjong`）を
 *   間接に引き込み、tsx（このパッケージでは CJS として解決する）から読めない
 *
 * その代わり `expectations.test.ts`（vitest）が、ここの値とアプリの公開状態・
 * hreflang の規則が一致することを検査する。英語のページを公開に切り替えたら、
 * `route-policy.ts` とここの両方を直す（片方だけだとテストが落ちる）。
 *
 * 日本語の索引対象・canonical・静的生成・HTTP の期待値は、ここではなく
 * baseline（移行前の成果物）から読む。日本語は「移行前と同じ」が期待値だから。
 */
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from "@mahjong-scoring/features/i18n/locales";
import { PRODUCTION_SITE_URL } from "@mahjong-scoring/features/site-url";

/** 監査する言語（先頭が既定の言語。公開 URL に接頭辞を持たない） */
export const AUDIT_LOCALES: readonly string[] = [
  DEFAULT_LOCALE,
  ...SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE),
];

/** 本番の origin（canonical・hreflang・sitemap の絶対 URL の前置き） */
export const SITE_ORIGIN = PRODUCTION_SITE_URL;

/**
 * 英語で出して索引させるページ（ロケール非依存のパス。完全一致の行）
 *
 * `route-policy.ts` の英語の許可リストのうち `published-indexable` の完全一致の行。
 * トップ・レッスンの目次と 19 章（はじめに `about-this-app` を除く）・早見表の
 * ハブ・役一覧・用語集の一覧・点数表。用語のページはテンプレート
 * （{@link EN_INDEXABLE_TEMPLATES}）で持つ。
 */
export const EN_INDEXABLE_PATHS: readonly string[] = [
  "/",
  "/lessons",
  "/lessons/why-scoring-is-hard-to-learn",
  "/lessons/why-scoring-is-complex",
  "/lessons/mangan-ko-ron",
  "/lessons/mangan-ko-tsumo",
  "/lessons/mangan-oya-ron",
  "/lessons/mangan-oya-tsumo",
  "/lessons/yaku",
  "/lessons/jantou-fu",
  "/lessons/mentsu-fu",
  "/lessons/machi-fu",
  "/lessons/tehai-fu",
  "/lessons/chiitoitsu-score",
  "/lessons/pinfu-score",
  "/lessons/menzen-mentsu-score",
  "/lessons/furo-score",
  "/lessons/fu-doubling",
  "/lessons/ron-to-tsumo",
  "/lessons/tsumo-payments",
  "/lessons/oya-ron-scores",
  "/reference",
  "/reference/yaku",
  "/reference/glossary",
  "/reference/score-table",
];

/**
 * 英語で出して索引させる動的ルートのテンプレート（テンプレート → 当てるパスの形）
 *
 * 用語のページ。監査は用語のレジストリを読まない（アプリのモジュールを import
 * しない。理由はモジュールの TSDoc）ので、具体的な URL は baseline の日本語の
 * 索引対象のうちテンプレートに合うものから導く（{@link expectedEnIndexablePaths}）。
 * 日本語で索引させている用語だけが英語の期待値になり、用語の追加・削除は
 * baseline を採り直すまで期待値に入らない。
 */
export const EN_INDEXABLE_TEMPLATES: ReadonlyMap<string, RegExp> = new Map([
  ["/reference/glossary/[slug]", /^\/reference\/glossary\/[a-z][a-z0-9-]*$/],
]);

/**
 * 英語で索引させるパスか（完全一致の行かテンプレートに合う）
 *
 * テンプレートは形だけを見る（`route-policy.ts` と同じ）。slug の実在は
 * ページが確かめるので、期待する具体的な URL の列挙には
 * {@link expectedEnIndexablePaths} を使う。
 *
 * @param path - ロケール非依存のパス
 */
export function isEnIndexable(path: string): boolean {
  if (EN_INDEXABLE_PATHS.includes(path)) return true;
  return [...EN_INDEXABLE_TEMPLATES.values()].some((pattern) =>
    pattern.test(path),
  );
}

/**
 * 英語で索引させる具体的なパスの一覧（期待値）
 *
 * 完全一致の行に、日本語の索引対象（baseline の sitemap）のうちテンプレートに
 * 合うものを足す。英語の成果物・sitemap・HTTP の期待値に使う。
 *
 * @param jaIndexable - 日本語で索引させるロケール非依存のパス
 */
export function expectedEnIndexablePaths(
  jaIndexable: Iterable<string>,
): readonly string[] {
  const templated = [...jaIndexable].filter(
    (path) =>
      !EN_INDEXABLE_PATHS.includes(path) &&
      [...EN_INDEXABLE_TEMPLATES.values()].some((pattern) =>
        pattern.test(path),
      ),
  );
  return [...EN_INDEXABLE_PATHS, ...new Set(templated)];
}

/** 英語で出しているが索引させないページ（いまは無い） */
export const EN_NOINDEX_PATHS: readonly string[] = [];

/**
 * 移行で baseline から意図して変わる HTTP の応答（パス → 期待する応答）
 *
 * - `/en`・`/en/...` は移行前もルートが無く 404 だった。英語で公開した
 *   ページだけが 200 になり、未公開の英語は 404 + noindex のまま。`/en` は
 *   英語の LP（ログイン済みでも dashboard へ rewrite しない。英語の dashboard は未公開）
 * - `/ja` は移行前は 404。移行後は外部から来た `/ja/...` を接頭辞なしの日本語
 *   URL へ 307 で正規化する（`/ja` を公開 URL として出さないため）。日本語の
 *   正規の URL のリダイレクトではない
 */
export const BASELINE_HTTP_CHANGES: ReadonlyMap<
  string,
  { readonly status: number; readonly location?: string }
> = new Map([
  ["/en", { status: 200 }],
  ["/en/reference/score-table", { status: 200 }],
  ["/ja", { status: 307, location: "/" }],
]);

/**
 * 移行前の robots.txt の Disallow（出現順）
 *
 * 英語の分類で robots.txt を一括で書き換えない（未公開の英語は proxy の 404 +
 * noindex で止め、Disallow で代用しない — Disallow したページはクロールされず
 * noindex も読まれない）。日本語の既存の除外はそのまま残す。
 */
export const BASELINE_ROBOTS_DISALLOW: readonly string[] = [
  "/admin",
  "/mypage",
  "/api",
  "/u/",
];

/**
 * 日本語で動的（要求ごとに描画）から静的生成へ移したことを認めるパス
 *
 * 移行で日本語の静的 / 動的は変えないのが原則で、変えてよいのはここに足した
 * パスだけ。例外はレッスンの目次 `/lessons` だけ — 英語の索引対象は静的生成が
 * 規約で、目次の公共部分（章の並び）は閲覧者に依らないため、日本語ごと静的にした
 * （本人の完了の印・`?rank=` の絞り込みはクライアントで付ける）。
 *
 * 1 本の一覧を build 監査の 2 つの台帳が同じ意味で読む（許可を台帳ごとに分けると、
 * 片方だけ足して片方が落ちる・片方だけ消し忘れる）:
 *
 * - 静的生成の台帳: 移行前に無かった日本語の静的ページとして現れてよい
 * - 動的ルートの台帳: 移行前は動的で、いまは動的でなくなってよい
 *
 * どちらの台帳でも、許可したのに移行が起きていない（いまも動的のまま・移行前から
 * 静的だった）パスは失敗にする（{@link matchStaticMigrations}）。許可が黙って
 * 空振りすると、意図した静的化が崩れても監査が通り、不要になった許可も残り続ける。
 *
 * 値は公開 URL のパスで、動的ルートの台帳ではルートのテンプレートと突き合わせる。
 * 動的セグメントを持たないページだけを載せる（両者が同じ文字列になるため）。
 */
export const ALLOWED_NEW_JA_STATIC: readonly string[] = ["/lessons"];

/**
 * 動的 → 静的の移行を許可の一覧と突き合わせる
 *
 * 台帳の差分（移行前と比べて静的の側へ移ったパス）を、許可したものと許可して
 * いないものに分け、許可したのに差分に現れなかったものを返す。どちらも空なら合格。
 *
 * @param moved - 静的の側へ移ったパス。静的生成の台帳では新たに静的生成された
 *   日本語のパス、動的ルートの台帳では移行前は動的でいまは動的でないテンプレート
 * @param allowed - 移行を認めるパス（既定は {@link ALLOWED_NEW_JA_STATIC}）
 * @returns `unexpected`: 許可に無い移行（昇順）。`unused`: 許可したのに移行が
 *   起きていないパス（昇順）
 */
export function matchStaticMigrations(
  moved: Iterable<string>,
  allowed: readonly string[] = ALLOWED_NEW_JA_STATIC,
): {
  readonly unexpected: readonly string[];
  readonly unused: readonly string[];
} {
  const movedSet = new Set(moved);
  const allowedSet = new Set(allowed);
  return {
    unexpected: [...movedSet].filter((path) => !allowedSet.has(path)).sort(),
    unused: [...allowedSet].filter((path) => !movedSet.has(path)).sort(),
  };
}

/**
 * ロケール非依存のパスを、その言語の本番の絶対 URL にする
 *
 * 既定の言語のトップは末尾スラッシュの無い origin、他の言語のトップは `/en`。
 *
 * @param path - ロケール非依存のパス
 * @param locale - 言語
 */
export function expectedUrl(path: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) {
    return path === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;
  }
  return `${SITE_ORIGIN}/${locale}${path === "/" ? "" : path}`;
}

/**
 * hreflang の期待値（言語キー → 本番の絶対 URL）
 *
 * 規則（HTML の `<link rel="alternate">` と sitemap の `<xhtml:link>` の両方）:
 *
 * - 索引させる言語だけを挙げる。404・未公開・noindex の相手は挙げない
 * - 両言語で索引させるページは `ja`・`en`・`x-default`。`x-default` は日本語
 * - 日本語だけで索引させるページは `ja` と `x-default`（片言語でも、実在する
 *   日本語と既定を出す。相手の言語が無いことを示す空の hreflang は出さない）
 * - 英語だけで索引させるページは `en` だけ（`x-default` は日本語に限る）
 * - どちらでも索引させないページは空
 *
 * @param path - ロケール非依存のパス
 * @param jaIndexable - 日本語で索引させるか
 * @param enIndexable - 英語で索引させるか
 */
export function expectedAlternates(
  path: string,
  jaIndexable: boolean,
  enIndexable: boolean,
): Readonly<Record<string, string>> {
  const alternates: Record<string, string> = {};
  if (jaIndexable) alternates.ja = expectedUrl(path, "ja");
  if (enIndexable) alternates.en = expectedUrl(path, "en");
  if (jaIndexable) alternates["x-default"] = expectedUrl(path, "ja");
  return alternates;
}

/**
 * 本番の絶対 URL を、言語とロケール非依存のパスに戻す
 *
 * 本番の origin でない URL は undefined。
 *
 * @param url - 絶対 URL
 */
export function parseSiteUrl(
  url: string,
): { readonly locale: string; readonly path: string } | undefined {
  if (url !== SITE_ORIGIN && !url.startsWith(`${SITE_ORIGIN}/`)) {
    return undefined;
  }
  const pathname = url.slice(SITE_ORIGIN.length) || "/";
  for (const locale of AUDIT_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (pathname === `/${locale}`) return { locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, path: pathname.slice(locale.length + 1) };
    }
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}
