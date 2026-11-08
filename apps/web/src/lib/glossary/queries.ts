import { getTranslations } from "next-intl/server";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import {
  glossaryTermPreview,
  glossaryTermViewBySlug,
  glossaryTermViews,
  type GlossaryTermPreview,
  type GlossaryTermView,
} from "@mahjong-scoring/features/glossary/views";

/**
 * すべての用語をその言語の索引の順で返す。
 * 用語一覧取得
 *
 * 一覧ページ（索引・分類の両方）と、関連語・プレビューの解決がここを通る。
 * 並び・索引の行は言語で変わる（日本語は読みの五十音、英語は見出し語の英字）ため、
 * ページが `prepareRouteLocale` で確定させた言語を受け取る。`getLocale()` で
 * 引かないのは、言語の出所をページの入口 1 か所に揃えるため。辞書はリクエストの
 * 言語（入口の `prepareRouteLocale` が `setRequestLocale` で確定させた、`locale` と
 * 同じ値）で引く。言語と名前空間をオブジェクトで渡す形の `getTranslations` に
 * しないのは、`client-messages.test.ts` がオブジェクトの名前空間の指定を
 * レジストリのクライアント参照として数え、サーバー専用の `glossary` を違反と
 * 判定するため。
 *
 * @param locale - ページの言語
 */
export async function getGlossaryTermViews(
  locale: SupportedLocale,
): Promise<readonly GlossaryTermView[]> {
  const t = await getTranslations("glossary");
  return glossaryTermViews((key) => t(key), locale);
}

/**
 * slug から表示用語を取得する。
 * 表示用語取得
 *
 * @param slug 対象用語のスラッグ（URL 由来の未検証の文字列でよい）
 * @param locale - ページの言語
 * @returns 該当する用語。未知の slug なら undefined。
 */
export async function getGlossaryTermViewBySlug(
  slug: string,
  locale: SupportedLocale,
): Promise<GlossaryTermView | undefined> {
  const t = await getTranslations("glossary");
  return glossaryTermViewBySlug(slug, (key) => t(key), locale);
}

/**
 * 指定した slug 群のプレビューを slug をキーにして返す。
 * 用語プレビュー解決
 *
 * 未知の slug は黙って落とす（呼び出し側は素のテキストへ degrade する）。
 * プレビューは言語に依らない形（索引の行を持たない）で、文言はリクエストの
 * 言語の辞書から引く。`href` はロケール非依存のパスのまま返し、言語の接頭辞は
 * 描く側（`GlossaryTermModalProvider`・`TermLink`）がページの言語で付ける。
 *
 * @param slugs 本文が参照している用語スラッグ（重複可）
 */
export async function resolveTermPreviews(
  slugs: readonly string[],
): Promise<Record<string, GlossaryTermPreview>> {
  const t = await getTranslations("glossary");
  const previews: Record<string, GlossaryTermPreview> = {};
  for (const slug of new Set(slugs)) {
    const preview = glossaryTermPreview(slug, (key) => t(key));
    if (preview !== undefined) previews[slug] = preview;
  }
  return previews;
}
