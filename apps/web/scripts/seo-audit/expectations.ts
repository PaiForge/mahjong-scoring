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
 * 英語で出して索引させるページ（ロケール非依存のパス）
 *
 * `route-policy.ts` の英語の許可リストのうち `published-indexable` のもの。
 */
export const EN_INDEXABLE_PATHS: readonly string[] = ["/reference/score-table"];

/** 英語で出しているが索引させないページ（いまは無い） */
export const EN_NOINDEX_PATHS: readonly string[] = [];

/**
 * 移行で baseline から意図して変わる HTTP の応答（パス → 期待する応答）
 *
 * - `/en`・`/en/...` は移行前もルートが無く 404 だった。英語で公開した
 *   ページだけが 200 になり、未公開の英語は 404 + noindex のまま
 * - `/ja` は移行前は 404。移行後は外部から来た `/ja/...` を接頭辞なしの日本語
 *   URL へ 307 で正規化する（`/ja` を公開 URL として出さないため）。日本語の
 *   正規の URL のリダイレクトではない
 */
export const BASELINE_HTTP_CHANGES: ReadonlyMap<
  string,
  { readonly status: number; readonly location?: string }
> = new Map([
  ["/en", { status: 404 }],
  ["/en/reference/score-table", { status: 200 }],
  ["/ja", { status: 307, location: "/" }],
]);

/**
 * 静的生成に新しく加わってよい日本語のパス
 *
 * 移行前に要求ごとに描画していたページが静的になるのは、明示した変更に限って
 * 認める（ここに足す）。いまは無い — 移行で日本語の静的 / 動的は変えない。
 */
export const ALLOWED_NEW_JA_STATIC: readonly string[] = [];

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
