import { revalidatePath } from "next/cache";

import type { AnnouncementInput } from "./validation";

/**
 * お知らせ入力値を announcements テーブルの行値に変換する。
 * お知らせ行変換
 *
 * create / update の両アクションで共通のマッピングを一元化する。
 * `null` は Drizzle のカラム書き込み境界のため許容される。
 */
export function toAnnouncementRow(data: AnnouncementInput): {
  slug: string;
  title: string;
  content: string;
  locale: string;
  status: string;
  pinnedAt: Date | null;
  publishedAt: Date | null;
} {
  return {
    slug: data.slug,
    title: data.title,
    content: data.content,
    locale: data.locale,
    status: data.status,
    pinnedAt: data.pinned ? new Date() : null,
    publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
  };
}

/**
 * お知らせ関連ページのキャッシュを無効化する。
 * お知らせ再検証
 */
export function revalidateAnnouncementPaths(slug: string): void {
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath(`/announcements/${slug}`);
}
