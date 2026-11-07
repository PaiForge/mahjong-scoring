/**
 * ページの Metadata（title・description・canonical・hreflang・OGP・Twitter Card）
 * メタデータヘルパー
 *
 * どのヘルパーも `locale`（省略時は日本語）を受け取り、その言語の辞書・URL・
 * OGP 画像で組み立てる。日本語の出力（title・description・canonical・OGP・
 * Twitter Card・robots）は locale を足す前と同じ文字列で、既存の日本語 URL の
 * 評価を動かさない。
 *
 * 守っている制約:
 *
 * - **`path` はロケール非依存のパスで受け取る**（`/reference/score-table`）。
 *   言語のパスへの変換（英語は `/en` 接頭辞、日本語は恒等）はここで
 *   `localizedHref` に通す。query・hash は canonical に混ぜない
 * - **canonical は表示している言語のページ自身。** 英語ページを日本語へ
 *   canonical で寄せない（言語ページごとに評価先を分ける）
 * - **hreflang（`alternates.languages`）は `getIndexableAlternates` の出力だけ。**
 *   sitemap も同じ関数を使い、HTML と sitemap で別々に組まない。404・未公開・
 *   noindex の相手は列挙しない（next-intl が自動で付ける `Link` ヘッダの
 *   alternate は `routing.ts` で止めている）
 * - **canonical と hreflang は同じ origin に解決する。** どちらもパス（相対）で
 *   返し、ルートレイアウトの `metadataBase`（`SITE_URL`）で絶対 URL にする。
 *   `getIndexableAlternates` は本番の origin（`PRODUCTION_SITE_URL`）の絶対 URL を
 *   返すので、その origin を外してパスに戻す（{@link toSiteRelative}）。本番では
 *   `SITE_URL` が本番の origin なので sitemap の絶対 URL と一致し、手元・Preview
 *   では canonical と hreflang が揃って同じ host を指す（canonical だけ手元・
 *   hreflang だけ本番、のように 1 ページの中で host が割れない）。日本語の
 *   canonical をパスのまま返すのは、既存の出力文字列を変えないため
 * - **`alternates` / `openGraph` / `twitter` は毎回完全な形で返す。** Next は
 *   これらをフィールド単位ではなくオブジェクトごと差し替えるため、親の値を
 *   当てにすると「og:image だけ欠けたページ」や「親のトップ canonical を
 *   継いだページ」になる
 * - **翻訳は `getTranslations({ locale, namespace })` で引く。** リクエストの
 *   ロケール（`headers()`）に落とさず、静的生成を保つ
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { localizedHref, splitHref } from "@/i18n/public-path";
import { getIndexableAlternates } from "@/i18n/seo-alternates";

import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import { PRODUCTION_SITE_URL } from "@mahjong-scoring/features/site-url";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

/** OGP / Twitter Card の画像 1 枚 */
export interface OgImage {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

/** 言語ごとのサイトの名乗り（サイト名・説明・既定タイトル・OGP） */
export interface SiteIdentity {
  /**
   * サイト名。英語でも日本語のブランド名のまま（`metadata.siteName`）。
   * 英語の検索語はタグラインとページのタイトルで受ける
   */
  readonly name: string;
  /** キャッチコピー（`metadata.siteTagline`） */
  readonly tagline: string;
  /** サイトの説明（meta description の既定・Organization の説明） */
  readonly description: string;
  /** トップとルートレイアウトのフォールバックのタイトル */
  readonly defaultTitle: string;
  /** OGP の `og:locale`（日本語 `ja_JP` / 英語 `en_US`） */
  readonly ogLocale: string;
  /** その言語の文言を焼き込んだ静的な OGP 画像 */
  readonly ogImage: OgImage;
}

/**
 * OGP 画像のパス（`public/` 直下）
 *
 * `pnpm --filter web og:generate` で再生成する（scripts/generate-og-image.ts）。
 * 画像に焼き込む文言は言語ごとに違うため、言語ごとに別のファイルを持つ。
 * 初回リクエストで描く動的生成（ImageResponse）にはしない — フォントの
 * 取得が失敗要因になり、クローラーの最初の取得が遅くなるため。
 */
const OG_IMAGE_PATHS = {
  ja: "/og-image.png",
  en: "/og-image-en.png",
} as const satisfies Record<SupportedLocale, string>;

/** OGP の推奨サイズ（Twitter の summary_large_image もこの比率） */
const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * `og:locale` の値。hreflang（`en`）とは別物で、OGP の表記規則
 * （言語_地域）に合わせるためだけに地域を付ける。英語の地域ターゲティングでは
 * ない
 */
const OG_LOCALES = {
  ja: "ja_JP",
  en: "en_US",
} as const satisfies Record<SupportedLocale, string>;

/**
 * 言語ごとの辞書の `metadata` 名前空間。
 *
 * サイト名は root layout・メールテンプレート・JSON-LD のような同期の文脈でも
 * 要るので、`getTranslations` ではなく辞書を直接読む。日本語へ fallback しない
 * （英語は完訳の名前空間だけを束ねた `messages/en` から引く）。
 */
const SITE_MESSAGES = {
  ja: jaMessages.metadata,
  en: enMessages.metadata,
} as const satisfies Record<
  SupportedLocale,
  { siteName: string; siteTagline: string; siteDescription: string }
>;

/**
 * 言語ごとのサイトの名乗りを返す
 * サイト名乗り取得
 *
 * @param locale - 言語（省略時は日本語）
 */
export function siteIdentity(
  locale: SupportedLocale = DEFAULT_LOCALE,
): SiteIdentity {
  const { siteName, siteTagline, siteDescription } = SITE_MESSAGES[locale];
  const defaultTitle = `${siteName} - ${siteTagline}`;
  return {
    name: siteName,
    tagline: siteTagline,
    description: siteDescription,
    defaultTitle,
    ogLocale: OG_LOCALES[locale],
    ogImage: {
      url: OG_IMAGE_PATHS[locale],
      ...OG_IMAGE_SIZE,
      alt: defaultTitle,
    },
  };
}

const JA_IDENTITY = siteIdentity("ja");

/**
 * サイト名
 * 唯一の正典は i18n 辞書（`@mahjong-scoring/messages`）の `metadata.siteName`。
 * タイトル・メタデータ・メールテンプレートはすべてこの名称に揃える。
 * 英語のページも同じブランド名を名乗る（{@link SiteIdentity.name}）。
 */
export const SITE_NAME = JA_IDENTITY.name;

/** サイトの説明文（日本語の meta description のデフォルト） */
export const SITE_DESCRIPTION = JA_IDENTITY.description;

/**
 * 日本語の OGP / Twitter Card の画像。
 * 英語は {@link siteIdentity}`("en").ogImage`（`/og-image-en.png`）。
 */
export const OG_IMAGE = JA_IDENTITY.ogImage;

/** 日本語のサイト既定のタイトル（トップページとルートレイアウトのフォールバック） */
export const DEFAULT_TITLE = JA_IDENTITY.defaultTitle;

/** ロケールを受け取るヘルパーの共通オプション */
export interface MetadataLocaleOptions {
  /** 表示する言語（省略時は日本語）。辞書・URL・OGP 画像がこの言語になる */
  readonly locale?: SupportedLocale;
}

/**
 * `getIndexableAlternates` の本番の絶対 URL を、`metadataBase` で解決する
 * サイト内のパスに戻す
 *
 * canonical と同じ origin（`SITE_URL`）に解決させるため（モジュールの TSDoc）。
 * 本番の origin で始まらない値（将来、外部の URL を返すようになった場合）は
 * そのまま返す。日本語トップは origin だけ（末尾スラッシュ無し）で来るので `/` にする。
 */
function toSiteRelative(url: string): string {
  if (url === PRODUCTION_SITE_URL) return "/";
  if (url.startsWith(`${PRODUCTION_SITE_URL}/`)) {
    return url.slice(PRODUCTION_SITE_URL.length);
  }
  return url;
}

/**
 * ロケール非依存のパスから、その言語ページの `alternates` を組み立てる
 * alternates生成
 *
 * canonical は表示している言語のページ自身（query・hash は落とす）。
 * hreflang は索引させる翻訳の組だけ（無ければ `languages` を持たない）。
 * noindex のページも自己 canonical は付けてよいが、hreflang には載らない。
 *
 * @param path - ロケール非依存のパス
 * @param locale - 表示している言語
 */
export function buildAlternates(
  path: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): NonNullable<Metadata["alternates"]> {
  const canonical = localizedHref(splitHref(path).pathname, locale);
  const languages = Object.fromEntries(
    Object.entries(getIndexableAlternates(path)).map(
      ([key, url]) => [key, toSiteRelative(url)] as const,
    ),
  );
  return Object.keys(languages).length > 0
    ? { canonical, languages }
    : { canonical };
}

/**
 * OGP / Twitter Card 一式を組み立てる
 * ソーシャルカード生成
 *
 * Next は openGraph / twitter をフィールド単位ではなくオブジェクトごと
 * 差し替えるため、常に完全な形を返す。images を省くと file convention の
 * 画像ごと消える（実測）ので、その言語の OGP 画像を毎回明示する。
 *
 * createMetadata が全ページで使うほか、ヘルパーを通らないルートレイアウト・
 * トップページもこれを spread する（手書き複製で乖離させない）。
 *
 * @param title - サイト名サフィックス込みの完全なタイトル
 * @param description - 説明（持たないページでは省略）
 * @param path - og:url にするロケール非依存のパス。canonical を持つページだけ渡す。
 *   og:url は canonical と同じく表示している言語のページ自身になる
 * @param locale - 表示する言語（省略時は日本語）
 */
export function buildSocialCard({
  title,
  description,
  path,
  locale = DEFAULT_LOCALE,
}: {
  readonly title: string;
  readonly description?: string;
  readonly path?: string;
} & MetadataLocaleOptions): Pick<Metadata, "openGraph" | "twitter"> {
  const identity = siteIdentity(locale);
  const url =
    path === undefined
      ? undefined
      : localizedHref(splitHref(path).pathname, locale);
  return {
    openGraph: {
      type: "website",
      siteName: identity.name,
      locale: identity.ogLocale,
      title,
      images: [identity.ogImage],
      ...(description ? { description } : {}),
      ...(url ? { url } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [identity.ogImage],
      ...(description ? { description } : {}),
    },
  };
}

/**
 * ページ用の Metadata を生成する
 * メタデータ生成
 */
export function createMetadata({
  title,
  description,
  path,
  locale = DEFAULT_LOCALE,
}: {
  readonly title: string;
  readonly description?: string;
  /**
   * canonical のロケール非依存のパス（例: `/lessons/jantou-fu`）。
   *
   * 言語のパス（英語は `/en/...`）にしてから、ルートレイアウトの
   * `metadataBase` を基準に絶対 URL へ解決される。検索結果に載せるページに
   * だけ渡すこと。noindex ページや play / result / training のような
   * 遷移先には不要。
   */
  readonly path?: string;
} & MetadataLocaleOptions): Metadata {
  const fullTitle = `${title} - ${siteIdentity(locale).name}`;

  return {
    title: fullTitle,
    ...(description ? { description } : {}),
    ...(path ? { alternates: buildAlternates(path, locale) } : {}),
    ...buildSocialCard({ title: fullTitle, description, path, locale }),
  };
}

/**
 * 名前空間の翻訳関数を、指定の言語で引く
 *
 * リクエストのロケールに頼らず言語を明示する（`headers()` に落とさない）。
 */
function translationsFor(namespace: string, locale: SupportedLocale) {
  return getTranslations({ locale, namespace });
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
 * @param options - タイトル・説明のキー（既定 "title" / "description"）・
 *   canonical のロケール非依存のパス・言語（省略時は日本語）
 */
export async function createNamespaceMetadata(
  namespace: string,
  options: {
    readonly title?: string;
    readonly description?: string;
    readonly path?: string;
  } & MetadataLocaleOptions = {},
): Promise<Metadata> {
  const {
    title = "title",
    description = "description",
    path,
    locale = DEFAULT_LOCALE,
  } = options;
  const t = await translationsFor(namespace, locale);

  return createMetadata({
    title: t(title),
    description: t(description),
    path,
    locale,
  });
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
 * @param path - canonical のロケール非依存のパス（検索結果に載せるページのみ指定する）
 * @param options - 言語（省略時は日本語）
 */
export async function createTitleOnlyMetadata(
  namespace: string,
  titleKey = "title",
  path?: string,
  options: MetadataLocaleOptions = {},
): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = options;
  const t = await translationsFor(namespace, locale);
  return createMetadata({ title: t(titleKey), path, locale });
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
 * @param options - 言語（省略時は日本語）
 */
export async function createPrivateMetadata(
  namespace: string,
  titleKey = "pageTitle",
  options: MetadataLocaleOptions = {},
): Promise<Metadata> {
  return {
    ...(await createTitleOnlyMetadata(namespace, titleKey, undefined, options)),
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
 * @param options - 言語（省略時は日本語）
 */
export async function createResultMetadata(
  namespace: string,
  options: MetadataLocaleOptions = {},
): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = options;
  const [t, tChallenge] = await Promise.all([
    translationsFor(namespace, locale),
    translationsFor("challenge", locale),
  ]);

  return {
    ...createMetadata({
      title: `${t("title")} - ${tChallenge("resultSuffix")}`,
      locale,
    }),
    // 結果ページはセッション直後にしか意味を持たない。index はさせず、
    // 再挑戦・説明ページへの内部リンクは辿らせる。
    robots: { index: false, follow: true },
  };
}
