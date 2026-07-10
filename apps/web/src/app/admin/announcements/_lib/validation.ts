import { isSupportedLocale } from "@/i18n/locales";
import { extractPgErrorCode } from "@/lib/db/extract-pg-error-code";

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

const VALID_STATUSES: readonly string[] = ["draft", "published"];
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/**
 * お知らせ入力のバリデーション。
 * 問題があれば i18n キー（admin.announcements 名前空間）を、なければ undefined を返す。
 */
export function validateAnnouncement(
  data: AnnouncementInput,
): string | undefined {
  if (!data.slug) {
    return "errorSlugRequired";
  }
  if (data.slug.length > 255 || !SLUG_PATTERN.test(data.slug)) {
    return "errorSlugFormat";
  }
  if (!data.title || data.title.length > 255) {
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

/**
 * postgres の unique 制約違反（23505）かどうか。
 * Drizzle が汎用 Error で wrap したケースも `extractPgErrorCode` が cause を辿って判定する。
 */
export function isUniqueViolation(err: unknown): boolean {
  return extractPgErrorCode(err) === "23505";
}
