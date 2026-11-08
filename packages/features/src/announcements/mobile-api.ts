import { z } from "zod";

import { DEFAULT_LOCALE, type SupportedLocale } from "../i18n/locales";

/**
 * アプリ向けのお知らせの API の契約（パス・応答）
 *
 * お知らせは誰が読んでも同じ公開の記事なので、他のアプリ向け API と違い
 * ログインを要らない（`Authorization` を付けずに読む）。
 *
 * @design 言語は任意の `?locale=ja|en`
 * アプリは端末の言語（`APP_LOCALE`）を付けて呼び、英語の端末には英訳して
 * 公開した記事だけを返させる（日本語の記事を英語の画面に混ぜない）。
 * `ja` と省略は同じ URL（クエリを付けない）にする — ストアに出ている古い版の
 * アプリは `locale` を付けずに呼び、従来どおり日本語（英語の行しか無い記事は
 * その行で埋める fallback 付き）の応答を受ける。サーバーは未指定・未対応の値も
 * 従来の応答にする。応答の形は言語で変えない。
 */

/**
 * `locale` を API のクエリの値にする。既定（ja）と省略は付けない（従来の URL のまま）
 */
function localeQueryValue(
  locale: SupportedLocale | undefined,
): string | undefined {
  return locale === undefined || locale === DEFAULT_LOCALE ? undefined : locale;
}

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * お知らせの一覧を返す API のパス（GET。`?page=` で 1 始まりのページ）
 * お知らせ一覧APIパス
 */
export const MOBILE_ANNOUNCEMENTS_API_PATH = `${MOBILE_API_PREFIX}/announcements`;

/**
 * お知らせの一覧の API の URL（パス + クエリ）
 * お知らせ一覧API URL
 *
 * `locale` が既定（ja）以外のときだけ `&locale=` を付ける（ja と省略は従来の URL）。
 *
 * @param page - 1 始まりのページ番号
 * @param locale - 読む記事の言語。省略は既定（ja）
 */
export function mobileAnnouncementsApiUrl(
  page: number,
  locale?: SupportedLocale,
): string {
  const url = `${MOBILE_ANNOUNCEMENTS_API_PATH}?page=${page}`;
  const value = localeQueryValue(locale);
  return value === undefined ? url : `${url}&locale=${value}`;
}

/**
 * お知らせ 1 件を返す API のパス（GET）
 * お知らせ詳細APIパス
 *
 * `locale` が既定（ja）以外のときだけ `?locale=` を付ける（ja と省略は従来のパス）。
 * 英語では英訳の行が無い記事は 404 `notFound` になる。
 *
 * @param slug - お知らせの slug（web の `/announcements/<slug>` と同じ）
 * @param locale - 読む記事の言語。省略は既定（ja）
 */
export function mobileAnnouncementApiPath(
  slug: string,
  locale?: SupportedLocale,
): string {
  const path = `${MOBILE_ANNOUNCEMENTS_API_PATH}/${encodeURIComponent(slug)}`;
  const value = localeQueryValue(locale);
  return value === undefined ? path : `${path}?locale=${value}`;
}

/**
 * 一覧の 1 行
 * お知らせ一覧項目
 */
export interface MobileAnnouncementSummary {
  readonly slug: string;
  readonly title: string;
  /** 公開日時（ISO 8601）。公開日の無い記事では無い */
  readonly publishedAt?: string;
  /** ピン留め中（一覧の先頭に固定され、印が付く） */
  readonly pinned: boolean;
}

/**
 * お知らせの一覧の 1 ページ
 * お知らせ一覧応答
 *
 * 並びは web の一覧と同じ（ピン留めが先、その中と残りは公開日の新しい順）。
 * 項目を足すときは省略可能にする — ストアに出ている版のアプリが古い形のまま読む。
 */
export interface MobileAnnouncementsResponse {
  readonly items: readonly MobileAnnouncementSummary[];
  /** 返したページ番号（範囲外を要求したら最後のページに丸める） */
  readonly page: number;
  /**
   * 総ページ数。お知らせが無くても 1（他の一覧の API と同じ）。以前は 0 を
   * 返していたが、アプリは「返したページ < 総ページ数」で次を読むかを決める
   * だけなので、どちらでも読み足しは出ない
   */
  readonly totalPages: number;
}

/**
 * お知らせ 1 件
 * お知らせ詳細応答
 */
export interface MobileAnnouncementResponse {
  readonly slug: string;
  readonly title: string;
  /**
   * 本文（Markdown。web の詳細ページと同じ原文）。アプリは
   * `announcements/markdown.ts` で読み、描き方を自分で決める
   */
  readonly content: string;
  /** 公開日時（ISO 8601）。公開日の無い記事では無い */
  readonly publishedAt?: string;
}

/**
 * お知らせの API 固有の失敗の理由
 *
 * - `notFound` — その slug の公開中のお知らせが無い（404。取り下げられた・
 *   下書きに戻された記事を、前に読んだ一覧から開いたとき。`locale=en` では
 *   英訳の行が無い記事も — 本文のリンクが日本語だけの記事を指したとき）
 */
export const MOBILE_ANNOUNCEMENT_ERROR_CODES = ["notFound"] as const;

/** お知らせの API 固有の失敗の理由（{@link MOBILE_ANNOUNCEMENT_ERROR_CODES}） */
export type MobileAnnouncementErrorCode =
  (typeof MOBILE_ANNOUNCEMENT_ERROR_CODES)[number];

const publishedAtSchema = z.iso.datetime({ offset: true }).optional();

const announcementsSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      publishedAt: publishedAtSchema,
      pinned: z.boolean(),
    }),
  ),
  page: z.number(),
  totalPages: z.number(),
});

const announcementSchema = z.object({
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  publishedAt: publishedAtSchema,
});

/**
 * お知らせの一覧の応答を検証する。形が違えば undefined
 * お知らせ一覧応答検証
 */
export function parseMobileAnnouncementsResponse(
  body: unknown,
): MobileAnnouncementsResponse | undefined {
  const parsed = announcementsSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

/**
 * お知らせ 1 件の応答を検証する。形が違えば undefined
 * お知らせ詳細応答検証
 */
export function parseMobileAnnouncementResponse(
  body: unknown,
): MobileAnnouncementResponse | undefined {
  const parsed = announcementSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}
