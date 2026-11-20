/**
 * お知らせの一覧・詳細の言語ごとの引き方
 * お知らせの言語別取得
 *
 * web の一覧・詳細、ダッシュボード、アプリ向け API が同じ規則で引くための入口。
 * 経路ごとに分岐を書くと、片方だけ fallback の有無が変わって「web の英語には
 * 出ないお知らせがアプリの英語には出る」といった食い違いになる。
 *
 * @design 日本語は fallback 付き、それ以外はその言語の行だけ
 * 日本語（`DEFAULT_LOCALE`）は fallback 付きのクエリ（slug ごとに
 * 要求言語 → 日本語 → その他で 1 件を選び、件数は `COUNT(DISTINCT slug)`）。
 *
 * 日本語以外は、その言語で書いて公開した行だけ（`*Exact`）。件数も同じ行だけを
 * 数える（一覧に出ない行を数えるとページ送りに空のページが生まれる）。英語の行が
 * 無い slug の詳細は null にし、日本語の本文へ fallback しない — 英語の画面に
 * 日本語の本文を混ぜないため。
 */
import type { Announcement } from "@/lib/db";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import {
  getPublishedAnnouncement,
  getPublishedAnnouncementCount,
  getPublishedAnnouncementCountExact,
  getPublishedAnnouncementExact,
  getPublishedAnnouncementsExact,
  getPublishedAnnouncementsPaginated,
} from "./queries";

/**
 * 一覧のページ送りに使う件数
 *
 * 日本語は slug の数（fallback 付き）、それ以外はその言語の公開行の数。
 *
 * @param locale - ページの言語
 */
export function countAnnouncementsFor(
  locale: SupportedLocale,
): Promise<number> {
  return locale === DEFAULT_LOCALE
    ? getPublishedAnnouncementCount()
    : getPublishedAnnouncementCountExact(locale);
}

/**
 * 一覧の 1 ページ分のお知らせ
 *
 * 日本語は fallback 付き、それ以外はその言語の公開行だけ
 * （{@link countAnnouncementsFor} と同じ母集団）。
 *
 * @param locale - ページの言語
 * @param limit - 取得件数
 * @param offset - 読み飛ばす件数
 */
export function listAnnouncementsFor(
  locale: SupportedLocale,
  limit: number,
  offset: number,
): Promise<Announcement[]> {
  return locale === DEFAULT_LOCALE
    ? getPublishedAnnouncementsPaginated(locale, limit, offset)
    : getPublishedAnnouncementsExact(locale, limit, offset);
}

/**
 * 詳細ページのお知らせ（無ければ null。呼び出し側が 404 にする）
 *
 * 日本語は fallback 付き（従来どおり）。それ以外はその言語の行だけで、
 * 日本語の行しか無い slug は null になる。どちらのクエリも `cache()` 付きで、
 * `generateMetadata` と page 本体から呼んでもリクエスト内で 1 回に畳まれる。
 *
 * @param slug - お知らせの slug
 * @param locale - ページの言語
 */
export function findAnnouncementFor(
  slug: string,
  locale: SupportedLocale,
): Promise<Announcement | null> {
  return locale === DEFAULT_LOCALE
    ? getPublishedAnnouncement(slug, locale)
    : getPublishedAnnouncementExact(slug, locale);
}
