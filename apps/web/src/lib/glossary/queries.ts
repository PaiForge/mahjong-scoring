import { getTranslations } from "next-intl/server";

import {
  glossaryTermPreview,
  glossaryTermViewBySlug,
  glossaryTermViews,
  type GlossaryTermPreview,
  type GlossaryTermView,
} from "@mahjong-scoring/features/glossary/views";

/**
 * すべての用語を読み順で返す。
 * 用語一覧取得
 *
 * 一覧ページ（五十音・分類の両方）と、関連語・プレビューの解決がここを通る。
 */
export async function getGlossaryTermViews(): Promise<
  readonly GlossaryTermView[]
> {
  const t = await getTranslations("glossary");
  return glossaryTermViews((key) => t(key));
}

/**
 * slug から表示用語を取得する。
 * 表示用語取得
 *
 * @param slug 対象用語のスラッグ（URL 由来の未検証の文字列でよい）
 * @returns 該当する用語。未知の slug なら undefined。
 */
export async function getGlossaryTermViewBySlug(
  slug: string,
): Promise<GlossaryTermView | undefined> {
  const t = await getTranslations("glossary");
  return glossaryTermViewBySlug(slug, (key) => t(key));
}

/**
 * 指定した slug 群のプレビューを slug をキーにして返す。
 * 用語プレビュー解決
 *
 * 未知の slug は黙って落とす（呼び出し側は素のテキストへ degrade する）。
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
