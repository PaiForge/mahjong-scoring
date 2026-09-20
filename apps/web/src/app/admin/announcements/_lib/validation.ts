import { isSupportedLocale } from "@/i18n/locales";

/** 管理フォームから受け取るお知らせ入力値 */
export interface AnnouncementInput {
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly locale: string;
  readonly status: string;
  /** 公開日時（ISO文字列）。フォームの未入力は null で表現される */
  readonly publishedAt: string | null;
  readonly pinned: boolean;
}

/**
 * お知らせ入力のバリデーションエラー（admin.announcements の i18n キー）
 */
export type AnnouncementValidationError =
  | "errorSlugRequired"
  | "errorSlugFormat"
  | "errorTitleRequired"
  | "errorContentRequired"
  | "errorLocaleInvalid"
  | "errorStatusInvalid"
  | "errorPublishedAtRequired";

/**
 * 各フィールドの最大長。
 *
 * 入力欄の `maxLength` もここから引くこと。DB 側は
 * `announcements.slug` / `.title` がいずれも `varchar(255)` で、
 * フォームに数値を書き写すと超過した入力が検証まで届かず
 * Postgres のエラーになる。
 */
export const ANNOUNCEMENT_LIMITS = {
  slug: 255,
  title: 255,
} as const;

const VALID_STATUSES: readonly string[] = ["draft", "published"];
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/**
 * お知らせ入力のバリデーション。
 * 問題があれば i18n キー（admin.announcements 名前空間）を、なければ undefined を返す。
 */
export function validateAnnouncement(
  data: AnnouncementInput,
): AnnouncementValidationError | undefined {
  if (!data.slug) {
    return "errorSlugRequired";
  }
  if (
    data.slug.length > ANNOUNCEMENT_LIMITS.slug ||
    !SLUG_PATTERN.test(data.slug)
  ) {
    return "errorSlugFormat";
  }
  if (!data.title || data.title.length > ANNOUNCEMENT_LIMITS.title) {
    return "errorTitleRequired";
  }
  if (!data.content) {
    return "errorContentRequired";
  }
  if (!isSupportedLocale(data.locale)) {
    return "errorLocaleInvalid";
  }
  if (!VALID_STATUSES.includes(data.status)) {
    return "errorStatusInvalid";
  }
  if (data.status === "published" && !data.publishedAt) {
    return "errorPublishedAtRequired";
  }
  return undefined;
}
