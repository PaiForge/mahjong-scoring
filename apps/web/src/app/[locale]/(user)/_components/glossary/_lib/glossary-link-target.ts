import { localizedHref, splitHref } from "@/i18n/public-path";
import { getTranslatedPublication } from "@/i18n/translated-publications";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import type { NavTarget } from "../../_lib/locale-links";

/**
 * 用語リンク・用語モーダルのリンクの張る先を、ページの言語で決める
 * 用語リンク先解決
 *
 * 用語リンク（`TermLink`）とモーダル（`GlossaryTermModalProvider`）はクライアントの
 * 部品で、教本の章の本文の奥から描かれる。サーバーの `resolveNavTargetFor` は
 * `route-policy.ts`（sitemap のレジストリを読む）に届くのでクライアントから
 * 読めない。そこでパンくずと同じく、クライアントからも読める軽い許可リスト
 * （`translated-publications.ts`。英語の分類の正本）を直接引く。
 *
 * - 既定の言語（日本語）では入力をそのまま返す（日本語の本文のリンクを動かさない）
 * - それ以外の言語で公開しているページならその言語の href（`/en/...`）
 * - 未公開なら日本語の href のまま `crossLocale: true`（英語の存在しない URL を
 *   作らない。描く側は素の `<a hrefLang="ja">` にする）
 *
 * @param path - ロケール非依存の href（`/reference/glossary/jantou`、
 * `/preferences#term-links`。query・hash を含んでよい）
 * @param locale - ページの言語（`useLocale()` の値。想定外の値は日本語として扱う）
 */
export function glossaryLinkTarget(path: string, locale: string): NavTarget {
  const pageLocale: SupportedLocale = isSupportedLocale(locale)
    ? locale
    : DEFAULT_LOCALE;
  if (pageLocale === DEFAULT_LOCALE) return { href: path, crossLocale: false };
  const published =
    getTranslatedPublication(splitHref(path).pathname, pageLocale) !==
    "unpublished";
  return published
    ? { href: localizedHref(path, pageLocale), crossLocale: false }
    : { href: path, crossLocale: true };
}
