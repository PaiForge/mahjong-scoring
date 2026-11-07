import type { Metadata } from "next";

import { createPrivateMetadata } from "@/app/_lib/metadata";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * BAN のページの metadata
 * BANページメタデータ
 *
 * 既定以外の言語（英語）では、本人だけが見る通知としてその言語の title と
 * `noindex, nofollow` を付ける（`createPrivateMetadata`）。英語の title が無いと
 * ルートレイアウトの既定の title のままになるため。
 *
 * @design 日本語では何も足さない
 *
 * 日本語の `/banned` はもともと metadata を持たず、ルートレイアウトの既定の
 * title のままだった。日本語の head を変えないため、日本語では空の metadata を
 * 返す（親の metadata がそのまま使われる）。
 *
 * @param locale - ページの言語
 */
export async function bannedPageMetadata(
  locale: SupportedLocale,
): Promise<Metadata> {
  if (locale === DEFAULT_LOCALE) return {};
  return createPrivateMetadata("banned", "title", { locale });
}
