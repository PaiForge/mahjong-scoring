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
 * 認証のページ（ログイン・登録・メール確認待ち・パスワードの再設定）の metadata
 * 認証ページメタデータ
 *
 * タイトルはページの言語の辞書から引く。robots は、既定以外の言語（英語）でだけ
 * その言語の公開状態の表（`robotsForPublication`）から付ける。英語の認証ページは
 * `published-noindex` なので `noindex, follow` になる。
 *
 * @design 日本語には robots を付けない
 *
 * 日本語の認証ページも公開状態の表では `published-noindex`（検索流入の受け皿に
 * しない分類）だが、日本語の出力はもともと meta robots を持たない（sitemap に
 * 載せないことで扱ってきた）。ここで日本語にも noindex を足すと既存の日本語の
 * 出力が変わるので、言語で分けて日本語は従来のまま返す。
 *
 * canonical（`path`）は渡さない。認証のページは検索結果に載せないため。
 *
 * @param namespace - 翻訳名前空間（例: "auth"）
 * @param titleKey - タイトルのキー
 * @param path - ロケール非依存のパス（公開状態を引くためだけに使う）
 * @param locale - ページの言語（`prepareRouteLocale` の結果）
 */
export async function createAuthPageMetadata(
  namespace: string,
  titleKey: string,
  path: string,
  locale: SupportedLocale,
): Promise<Metadata> {
  const metadata = await createTitleOnlyMetadata(
    namespace,
    titleKey,
    undefined,
    {
      locale,
    },
  );
  if (locale === DEFAULT_LOCALE) return metadata;
  const robots = robotsForPublication(path, locale);
  return robots === undefined ? metadata : { ...metadata, robots };
}
