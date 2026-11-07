import type { Metadata } from "next";

import {
  createTitleOnlyMetadata,
  robotsForPublication,
} from "@/app/_lib/metadata";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

/**
 * 認証のページ（ログイン・登録・メール確認待ち・パスワードの再設定）の metadata
 * 認証ページメタデータ
 *
 * タイトルはページの言語の辞書から引き、robots はその言語の公開状態の表
 * （`robotsForPublication`）から決める。英語の認証ページは `published-noindex`
 * なので `noindex, follow` が付く。日本語は従来どおり robots を持たない
 * （meta noindex を足すと既存の日本語の出力が変わる。日本語の認証ページは
 * canonical も持たず、検索流入の受け皿にしていない）。
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
  const robots = robotsForPublication(path, locale);
  return robots === undefined ? metadata : { ...metadata, robots };
}
