import { z } from "zod";

/**
 * アプリ向けのお知らせの API の契約（パス・応答）
 *
 * お知らせは誰が読んでも同じ公開の記事なので、他のアプリ向け API と違い
 * ログインを要らない（`Authorization` を付けずに読む）。
 */

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
 * @param page - 1 始まりのページ番号
 */
export function mobileAnnouncementsApiUrl(page: number): string {
  return `${MOBILE_ANNOUNCEMENTS_API_PATH}?page=${page}`;
}

/**
 * お知らせ 1 件を返す API のパス（GET）
 * お知らせ詳細APIパス
 *
 * @param slug - お知らせの slug（web の `/announcements/<slug>` と同じ）
 */
export function mobileAnnouncementApiPath(slug: string): string {
  return `${MOBILE_ANNOUNCEMENTS_API_PATH}/${encodeURIComponent(slug)}`;
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
  /** 総ページ数。お知らせが無ければ 0 */
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
 *   下書きに戻された記事を、前に読んだ一覧から開いたとき）
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
