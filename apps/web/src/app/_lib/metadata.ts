import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import messages from "@/messages/ja.json";

/**
 * サイト名
 * 唯一の正典は i18n 辞書（messages/ja.json）の `metadata.siteName`。
 * タイトル・メタデータ・メールテンプレートはすべてこの名称に揃える。
 */
export const SITE_NAME = messages.metadata.siteName;

/** サイトのキャッチコピー（トップページのタイトル等に使用） */
export const SITE_TAGLINE = messages.metadata.siteTagline;

/** サイトの説明文（meta description のデフォルト） */
export const SITE_DESCRIPTION = messages.metadata.siteDescription;

/**
 * ページ用の Metadata を生成する
 * メタデータヘルパー
 */
export function createMetadata({
  title,
  description,
}: {
  readonly title: string;
  readonly description?: string;
}): Metadata {
  return {
    title: `${title} - ${SITE_NAME}`,
    ...(description ? { description } : {}),
  };
}

/**
 * 翻訳名前空間から Metadata を生成する
 * 名前空間メタデータ生成
 *
 * 「getTranslations(ns) → createMetadata({title, description})」という
 * next-intl の呼び出し規約の唯一の定義。learn 系の createLearnMetadata も
 * これを土台にしている。説明を持たないページは
 * {@link createTitleOnlyMetadata} を使うこと。
 *
 * @param namespace - 翻訳名前空間（例: "jantouFu"）
 * @param keys - タイトル・説明のキー（既定 "title" / "description"）
 */
export async function createNamespaceMetadata(
  namespace: string,
  keys: {
    readonly title?: string;
    readonly description?: string;
  } = {},
): Promise<Metadata> {
  const { title = "title", description = "description" } = keys;
  const t = await getTranslations(namespace);

  return createMetadata({ title: t(title), description: t(description) });
}

/**
 * 説明を持たないページの Metadata を生成する
 * タイトルのみメタデータ生成
 *
 * play ページのように辞書に description を持たないページ用。
 * 存在しないキーを引かないよう、意図を型で分けている。
 *
 * @param namespace - 翻訳名前空間（例: "jantouFu"）
 * @param titleKey - タイトルのキー（既定 "title"）
 */
export async function createTitleOnlyMetadata(
  namespace: string,
  titleKey = "title",
): Promise<Metadata> {
  const t = await getTranslations(namespace);
  return createMetadata({ title: t(titleKey) });
}

/**
 * 練習の結果ページ用 Metadata を生成する
 * 結果ページメタデータ生成
 *
 * タイトルは「<練習名> - <結果サフィックス>」。10 種の result ページで共通。
 *
 * @param namespace - 練習の翻訳名前空間（例: "jantouFu"）
 */
export async function createResultMetadata(
  namespace: string,
): Promise<Metadata> {
  const [t, tChallenge] = await Promise.all([
    getTranslations(namespace),
    getTranslations("challenge"),
  ]);

  return createMetadata({
    title: `${t("title")} - ${tChallenge("resultSuffix")}`,
  });
}
