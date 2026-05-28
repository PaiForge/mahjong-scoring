import { isSupportedLocale } from "@/i18n/locales";

/** 管理フォームから受け取るお知らせ入力値 */
export interface AnnouncementInput {
  slug: string;
  title: string;
  content: string;
  locale: string;
  status: string;
  publishedAt: string | null;
  pinned: boolean;
}

const VALID_STATUSES = ["draft", "published"] as const;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/**
 * お知らせ入力のバリデーション。
 * 問題があれば i18n キー（admin.announcements 名前空間）を、なければ null を返す。
 */
export function validateAnnouncement(data: AnnouncementInput): string | null {
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
  if (!VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
    return "errorStatusInvalid";
  }
  if (data.status === "published" && !data.publishedAt) {
    return "errorPublishedAtRequired";
  }
  return null;
}

/** postgres の unique 制約違反（23505）かどうか */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}
