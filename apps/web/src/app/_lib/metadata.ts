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
 * OGP / Twitter Card の画像。
 * `pnpm --filter web og:generate` で再生成する（scripts/generate-og-image.ts）。
 */
export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} - ${SITE_TAGLINE}`,
} as const;

/** サイト既定のタイトル（トップページとルートレイアウトのフォールバック） */
export const DEFAULT_TITLE = `${SITE_NAME} - ${SITE_TAGLINE}`;

/**
 * OGP / Twitter Card 一式を組み立てる
 * ソーシャルカード生成
 *
 * Next は openGraph / twitter をフィールド単位ではなくオブジェクトごと
 * 差し替えるため、常に完全な形を返す。images を省くと file convention の
 * 画像ごと消える（実測）ので OG_IMAGE を毎回明示する。
 *
 * createMetadata が全ページで使うほか、ヘルパーを通らないルートレイアウト・
 * トップページもこれを spread する（手書き複製で乖離させない）。
 *
 * @param title - サイト名サフィックス込みの完全なタイトル
 * @param description - 説明（持たないページでは省略）
 * @param path - og:url にするパス。canonical を持つページだけ渡す
 */
export function buildSocialCard({
  title,
  description,
  path,
}: {
  readonly title: string;
  readonly description?: string;
  readonly path?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ja_JP",
      title,
      images: [OG_IMAGE],
      ...(description ? { description } : {}),
      ...(path ? { url: path } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [OG_IMAGE],
      ...(description ? { description } : {}),
    },
  };
}

/**
 * ページ用の Metadata を生成する
 * メタデータヘルパー
 */
export function createMetadata({
  title,
  description,
  path,
}: {
  readonly title: string;
  readonly description?: string;
  /**
   * canonical URL のパス（例: `/learn/jantou-fu`）。
   *
   * ルートレイアウトの `metadataBase` を基準に絶対 URL へ解決される。
   * 検索結果に載せるページにだけ渡すこと。noindex ページや
   * play / result / training のような遷移先には不要。
   */
  readonly path?: string;
}): Metadata {
  const fullTitle = `${title} - ${SITE_NAME}`;

  return {
    title: fullTitle,
    ...(description ? { description } : {}),
    ...(path ? { alternates: { canonical: path } } : {}),
    ...buildSocialCard({ title: fullTitle, description, path }),
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
 * @param options - タイトル・説明のキー（既定 "title" / "description"）と
 *   canonical のパス
 */
export async function createNamespaceMetadata(
  namespace: string,
  options: {
    readonly title?: string;
    readonly description?: string;
    readonly path?: string;
  } = {},
): Promise<Metadata> {
  const { title = "title", description = "description", path } = options;
  const t = await getTranslations(namespace);

  return createMetadata({ title: t(title), description: t(description), path });
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
 * @param path - canonical のパス（検索結果に載せるページのみ指定する）
 */
export async function createTitleOnlyMetadata(
  namespace: string,
  titleKey = "title",
  path?: string,
): Promise<Metadata> {
  const t = await getTranslations(namespace);
  return createMetadata({ title: t(titleKey), path });
}

/**
 * 検索エンジンに載せないページの Metadata を生成する
 * 非公開ページメタデータ生成
 *
 * マイページのようにログインユーザー本人だけが見るページ用。
 * {@link createTitleOnlyMetadata} に noindex を足したもの。
 *
 * @param namespace - 翻訳名前空間（例: "mypage"）
 * @param titleKey - タイトルのキー（既定 "pageTitle"）
 */
export async function createPrivateMetadata(
  namespace: string,
  titleKey = "pageTitle",
): Promise<Metadata> {
  return {
    ...(await createTitleOnlyMetadata(namespace, titleKey)),
    robots: { index: false, follow: false },
  };
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
