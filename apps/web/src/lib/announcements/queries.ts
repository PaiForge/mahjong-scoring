/**
 * 公開お知らせ取得クエリ
 * お知らせクエリ
 *
 * 公開のお知らせを引く関数は 2 系統ある。
 *
 * - **fallback 付き**（{@link getPublishedAnnouncementsPaginated}・
 *   {@link getPublishedAnnouncementCount}・{@link getPublishedAnnouncement}・
 *   {@link getPublishedAnnouncementSlugsForSitemap}）: 日本語の画面とアプリ向け API 用。
 *   slug を 1 件として数え、要求した言語の行が無ければ日本語（`DEFAULT_LOCALE`）で埋める
 * - **言語一致**（`*Exact`）: 英語の画面用。その言語で書いて公開した行だけを引き、
 *   他の言語で埋めない
 *
 * @design 英語のお知らせは fallback 無し・noindex・動的ページのまま
 * 英語の一覧は {@link getPublishedAnnouncementsExact} +
 * {@link getPublishedAnnouncementCountExact}、詳細は
 * {@link getPublishedAnnouncementExact} で引き、英語の行が無い slug は 404 にする
 * （日本語の本文を英語の画面に混ぜない）。索引対象のページは静的生成が規約で、
 * お知らせを静的にするには一覧のページ送り（`?page=`）をパスに移し、
 * `generateStaticParams` で全言語の公開 slug をビルド時に引く変更が要る。
 * 英訳のお知らせはまだ無く検索の受け皿にもならないので、日本語の動的 / 静的の
 * 分類を変えずに済む noindex を採った（言語ごとの ISR + 管理画面での
 * キャッシュ無効化で索引させる案は採らなかった）。英訳が増えて索引させたく
 * なったら静的化を別に設計する。
 *
 * 既存の fallback 付きの関数の意味を変えると日本語とモバイルの一覧が変わるので、
 * 言語一致の関数は別の関数として足している。
 */

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
 * 日本語の画面とアプリ向け API 用（fallback 付き）。
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

/**
 * 公開お知らせの件数（slug ごとに 1 件としてカウント）
 *
 * 日本語の画面とアプリ向け API 用（fallback 付き）。どの言語の行でも
 * 公開されていれば 1 件と数える（{@link getPublishedAnnouncementsPaginated}
 * が slug ごとに 1 件を返すのと揃える）。
 */
export async function getPublishedAnnouncementCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${announcements.slug})` })
    .from(announcements)
    .where(eq(announcements.status, AnnouncementStatus.Published));

  return Number(result.count);
}

/**
 * その言語で書いて公開したお知らせの件数（fallback 無し）
 * 言語一致の公開お知らせ件数
 *
 * {@link getPublishedAnnouncementsExact} のページ送りに使う件数。他の言語の
 * 行しか無い slug は数えない（一覧に出ない行を数えると、空のページが生まれる）。
 * (slug, locale) は一意（`uq_announcements_slug_locale`）なので、言語で絞れば
 * 1 行 = 1 slug になり `COUNT(DISTINCT slug)` は要らない。日本語の画面と
 * アプリ向け API は従来の {@link getPublishedAnnouncementCount}
 * （DISTINCT の件数）のまま。
 *
 * @param locale - 数える言語（この言語の行だけ）
 */
export async function getPublishedAnnouncementCountExact(
  locale: SupportedLocale,
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(announcements)
    .where(
      and(
        eq(announcements.status, AnnouncementStatus.Published),
        eq(announcements.locale, locale),
      ),
    );

  return Number(result.count);
}

/** sitemap 生成用の公開お知らせ slug 一覧（ロケール variant は最新の published_at に集約） */
export interface PublishedAnnouncementSlug {
  readonly slug: string;
  readonly publishedAt: Date | null;
}

/**
 * sitemap.ts から利用する、公開お知らせの slug + 最終更新日時の一覧を取得する
 *
 * 日本語の sitemap 用。英語のお知らせは noindex なので、言語を問わず
 * slug ごとに 1 行へ集約する。
 */
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
 * 日本語の画面とアプリ向け API 用（fallback 付き）。
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

/**
 * slug のその言語の公開お知らせを 1 件取得する（fallback 無し）
 * 言語一致の公開お知らせ取得
 *
 * 英語の詳細ページ用。要求した言語の行が無ければ、他の言語（日本語）の行が
 * 公開されていても null を返し、呼び出し側は 404 にする（日本語の本文を
 * 英語の画面に出さない）。(slug, locale) は一意（`uq_announcements_slug_locale`）
 * なので高々 1 行。日本語の画面とアプリ向け API は従来の
 * {@link getPublishedAnnouncement}（fallback 付き）のまま。
 *
 * `generateMetadata` と page 本体の両方から同じ引数で呼ばれるため、
 * React の `cache()` でリクエスト内のクエリを 1 回に重複排除する。
 *
 * @param slug - お知らせの slug
 * @param locale - 取得する言語（この言語の行だけ）
 */
export const getPublishedAnnouncementExact = cache(
  async (
    slug: string,
    locale: SupportedLocale,
  ): Promise<Announcement | null> => {
    const [result] = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.status, AnnouncementStatus.Published),
          eq(announcements.slug, slug),
          eq(announcements.locale, locale),
        ),
      )
      .limit(1);

    return result ?? null;
  },
);
