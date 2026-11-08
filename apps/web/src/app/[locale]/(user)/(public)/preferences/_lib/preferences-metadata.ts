import type { Metadata } from "next";

import {
  createTitleOnlyMetadata,
  robotsForPublication,
} from "@/app/_lib/metadata";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * 設定のページ（`/preferences`・`/preferences/yaku-order`）の Metadata
 * 設定ページメタデータ
 *
 * タイトルはページの言語の辞書から引く（説明は持たない）。
 *
 * 英語のページは機能画面なので索引させない。robots は公開状態の表
 * （`published-noindex`）から引く（`robotsForPublication`）。日本語は従来どおり
 * robots の meta を出さない — 日本語の公開状態も `published-noindex` だが、
 * 日本語の設定ページに今まで無かった noindex を足すのは既存の出力の変更に
 * なるため、日本語では表を引かない。
 *
 * @param namespace - タイトルの名前空間（`settings` / `settings.yakuOrder`）
 * @param path - ページのロケール非依存のパス
 * @param locale - ページの言語
 */
export async function createPreferencesMetadata(
  namespace: string,
  path: string,
  locale: SupportedLocale,
): Promise<Metadata> {
  const metadata = await createTitleOnlyMetadata(
    namespace,
    "pageTitle",
    undefined,
    { locale },
  );
  if (locale === DEFAULT_LOCALE) return metadata;
  const robots = robotsForPublication(path, locale);
  return robots === undefined ? metadata : { ...metadata, robots };
}
