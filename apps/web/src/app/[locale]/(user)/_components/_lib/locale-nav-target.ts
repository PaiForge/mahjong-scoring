import "server-only";

import { resolvePublishedHref } from "@/i18n/navigation";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import type { NavTarget } from "./locale-links";

/**
 * 本文中のリンクの href を、その言語のページから張る先にする
 * 本文リンク先解決
 *
 * シェルの {@link resolveNavTarget}（`locale-links.ts`）と同じ規則を、表を介さず
 * サーバーで直接 `resolvePublishedHref` に問う版。レッスンの目次・章の前後のリンク・
 * LP の CTA のように、英語で未公開のページを本文から指す場所が使う。
 *
 * - 既定の言語（日本語）では入力をそのまま返す（日本語のページのリンクを 1 本も
 *   動かさない）
 * - それ以外の言語で、その言語で公開しているページならその言語の href
 *   （query・hash は残す）
 * - 未公開なら日本語の href のまま `crossLocale: true`。英語の存在しない URL を
 *   作らない。描く側は `LocaleNavLink`（`crossLocale` なら素の `<a hrefLang="ja">`）と
 *   `JapaneseOnlyMark` で「日本語のみ」と明示する
 *
 * サーバー専用（`server-only`）。`route-policy.ts` は sitemap のルートの
 * レジストリを読み込むため、クライアントの部品はこの結果を props で受け取る
 * （理由は `locale-links.ts` の TSDoc）。
 *
 * @param path - ロケール非依存の href（query・hash を含んでよい）
 * @param locale - リンクを置くページの言語
 */
export function resolveNavTargetFor(
  path: string,
  locale: SupportedLocale,
): NavTarget {
  if (locale === DEFAULT_LOCALE) return { href: path, crossLocale: false };
  const published = resolvePublishedHref(path, locale);
  if (published === undefined) return { href: path, crossLocale: true };
  return { href: published, crossLocale: false };
}
