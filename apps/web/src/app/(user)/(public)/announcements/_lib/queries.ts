import { and, desc, eq, sql } from "drizzle-orm";

import { type Announcement, announcements, db } from "@/lib/db";
import { DEFAULT_LOCALE, pickByLocale } from "@/i18n/locales";

/**
 * 公開お知らせのページネーション取得（slug 重複排除）
 *
 * @description
 * 同一 slug の複数ロケール variant を ROW_NUMBER() で 1 件に絞り、
 * 要求ロケール → DEFAULT_LOCALE → 任意 の優先度で best な variant を選ぶ。
 * 並び順は pinned_at DESC NULLS LAST, published_at DESC。
 */
export async function getPublishedAnnouncementsPaginated(
  locale: string,
  limit: number,
  offset: number,
): Promise<Announcement[]> {
  const rows = await db.execute<Announcement>(sql`
    SELECT
      id,
      slug,
      title,
      content,
      locale,
      status,
      pinned_at AS "pinnedAt",
      published_at AS "publishedAt",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY ${announcements.slug}
          ORDER BY
            CASE ${announcements.locale}
              WHEN ${locale} THEN 0
              WHEN ${DEFAULT_LOCALE} THEN 1
              ELSE 2
            END
        ) AS rn
      FROM ${announcements}
      WHERE ${announcements.status} = 'published'
    ) ranked
    WHERE rn = 1
    ORDER BY pinned_at DESC NULLS LAST, published_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return rows;
}

/** 公開お知らせの件数（slug ごとに 1 件としてカウント） */
export async function getPublishedAnnouncementCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${announcements.slug})` })
    .from(announcements)
    .where(eq(announcements.status, "published"));

  return Number(result.count);
}

/**
 * slug 単体の公開お知らせを取得。
 * 全ロケール variant を取得し pickByLocale で best を選ぶ。
 */
export async function getPublishedAnnouncement(
  slug: string,
  locale: string,
): Promise<Announcement | null> {
  const results = await db
    .select()
    .from(announcements)
    .where(and(eq(announcements.slug, slug), eq(announcements.status, "published")))
    .orderBy(desc(announcements.publishedAt));

  if (results.length === 0) {
    return null;
  }

  return pickByLocale(results, locale);
}
