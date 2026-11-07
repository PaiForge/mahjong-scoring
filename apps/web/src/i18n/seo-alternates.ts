/**
 * 言語別ページの hreflang（相互の alternate）
 * hreflang生成
 *
 * metadata（`<link rel="alternate" hreflang>`）と sitemap（`xhtml:link`）は
 * どちらもこの関数の出力を使う。HTML と sitemap で別々に組むと、片方だけ
 * 404 の相手を列挙するような食い違いが起きる。next-intl が自動で付ける
 * `Link` ヘッダの alternate は `routing.ts` で止めている（翻訳の有無を知らず、
 * 未訳の英語 URL まで列挙するため）。
 *
 * 規則:
 *
 * - 列挙するのは、その言語で `published-indexable` のページだけ。404・未公開・
 *   noindex のページ、API・管理画面は相手として挙げない
 * - 両言語で索引させるページは `ja`・`en`・`x-default` の 3 つ。`x-default` は
 *   日本語（言語を指定しない検索者に出す既定）
 * - 日本語だけのページは `ja` と `x-default`（実在する日本語だけ）
 * - 英語だけで索引させるページは `en` だけ（`x-default` は日本語に限る）
 * - どちらでも索引させないページは空
 *
 * URL は本番の origin（`PRODUCTION_SITE_URL`）からの絶対 HTTPS URL。
 * Preview や手元の `NEXT_PUBLIC_SITE_URL` は使わない — hreflang は検索エンジンに
 * 本番の URL どうしの対応を伝えるもので、Preview の URL を相手に挙げると
 * 索引されない URL を指すことになる。日本語トップは末尾スラッシュ無しの
 * origin（`https://score.mahjong.help`）で、sitemap と Next の canonical の
 * 出力（`/` を origin に解決する）に揃える。英語トップは `/en`。
 */

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { PRODUCTION_SITE_URL } from "@mahjong-scoring/features/site-url";

import { localizedHref, splitHref } from "./public-path";
import { getPublication } from "./route-policy";

/** hreflang の言語キー（`x-default` を含む） */
export type HreflangKey = SupportedLocale | "x-default";

/**
 * ロケール非依存のパスを、その言語の本番の絶対 URL にする
 * 本番絶対URL
 *
 * query・hash は落とす（canonical・hreflang に query を混ぜない）。
 *
 * @param path - ロケール非依存のパス
 * @param locale - 言語
 */
export function productionUrl(path: string, locale: SupportedLocale): string {
  const { pathname } = splitHref(path);
  const localized = localizedHref(pathname, locale);
  return localized === "/"
    ? PRODUCTION_SITE_URL
    : `${PRODUCTION_SITE_URL}${localized}`;
}

/**
 * ロケール非依存のパスの hreflang（言語キー → 本番の絶対 URL）を返す
 * 索引可能alternate取得
 *
 * 規則はモジュールの TSDoc。キーは {@link HreflangKey} のいずれかで、
 * 順は `ja`・`en`・`x-default`。
 *
 * @param path - ロケール非依存のパス（query・hash は無視する）
 */
export function getIndexableAlternates(
  path: string,
): Readonly<Record<string, string>> {
  const isIndexable = (locale: SupportedLocale) =>
    getPublication(path, locale) === "published-indexable";
  const ja = isIndexable("ja");
  const en = isIndexable("en");
  const entries: (readonly [HreflangKey, string])[] = [];
  if (ja) entries.push(["ja", productionUrl(path, "ja")]);
  if (en) entries.push(["en", productionUrl(path, "en")]);
  if (ja) entries.push(["x-default", productionUrl(path, "ja")]);
  return Object.freeze(Object.fromEntries(entries));
}
