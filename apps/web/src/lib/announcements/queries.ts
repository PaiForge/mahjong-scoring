import { cache } from "react";

import { and, desc, eq, sql } from "drizzle-orm";

import { type Announcement, announcements, db } from "@/lib/db";
import { AnnouncementStatus } from "@/lib/announcement-status";
import {
  DEFAULT_LOCALE,
  pickByLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

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
      WHERE ${announcements.status} = ${AnnouncementStatus.Published}
    ) ranked
    WHERE rn = 1
    ORDER BY pinned_at DESC NULLS LAST, published_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return rows;
}

/**
 * その言語で書かれた公開お知らせだけをページネーション取得する（fallback 無し）
 * 言語一致の公開お知らせ取得
 *
 * @description
 * {@link getPublishedAnnouncementsPaginated} と違い、要求した言語の行が無い
 * slug は他の言語（日本語）で埋めずに結果から落とす。英語の画面は英訳して
 * 公開した行だけを出す方針で、日本語の本文を英語の画面に混ぜないため。
 * (slug, locale) は一意（`uq_announcements_slug_locale`）なので、言語で絞れば
 * slug の重複排除は要らない。並び順は既存のクエリと同じ
 * pinned_at DESC NULLS LAST, published_at DESC。
 *
 * 日本語の画面とアプリ向け API（`DEFAULT_LOCALE` 固定）は従来の
 * fallback 付きのクエリを使い続ける。既存のクエリの意味を変えると
 * 日本語とモバイルの一覧が変わるので、別の関数として足している。
 *
 * @param locale - 取得する言語（この言語の行だけ）
 * @param limit - 取得件数
 * @param offset - 読み飛ばす件数
 */
export async function getPublishedAnnouncementsExact(
  locale: SupportedLocale,
  limit: number,
  offset: number,
): Promise<Announcement[]> {
  return db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.status, AnnouncementStatus.Published),
        eq(announcements.locale, locale),
      ),
    )
    .orderBy(
      sql`${announcements.pinnedAt} DESC NULLS LAST`,
      desc(announcements.publishedAt),
    )
    .limit(limit)
    .offset(offset);
}

/** 公開お知らせの件数（slug ごとに 1 件としてカウント） */
export async function getPublishedAnnouncementCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${announcements.slug})` })
    .from(announcements)
    .where(eq(announcements.status, AnnouncementStatus.Published));

  return Number(result.count);
}

/** sitemap 生成用の公開お知らせ slug 一覧（ロケール variant は最新の published_at に集約） */
export interface PublishedAnnouncementSlug {
  readonly slug: string;
  readonly publishedAt: Date | null;
}

/** sitemap.ts から利用する、公開お知らせの slug + 最終更新日時の一覧を取得する */
export async function getPublishedAnnouncementSlugsForSitemap(): Promise<
  PublishedAnnouncementSlug[]
> {
  const rows = await db
    .select({
      slug: announcements.slug,
      publishedAt: sql<Date | null>`MAX(${announcements.publishedAt})`,
    })
    .from(announcements)
    .where(eq(announcements.status, AnnouncementStatus.Published))
    .groupBy(announcements.slug);

  return rows;
}

/**
 * slug 単体の公開お知らせを取得。
 * 全ロケール variant を取得し pickByLocale で best を選ぶ。
 *
 * `generateMetadata` と page 本体の両方から同じ引数で呼ばれるため、
 * React の `cache()` でリクエスト内のクエリを 1 回に重複排除する。
 */
export const getPublishedAnnouncement = cache(
  async (slug: string, locale: string): Promise<Announcement | null> => {
    const results = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.slug, slug),
          eq(announcements.status, AnnouncementStatus.Published),
        ),
      )
      .orderBy(desc(announcements.publishedAt));

    if (results.length === 0) {
      return null;
    }

    return pickByLocale(results, locale);
  },
);
