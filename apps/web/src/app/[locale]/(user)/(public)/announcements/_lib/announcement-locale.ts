/**
 * お知らせの一覧・詳細の言語ごとの引き方
 * お知らせの言語別取得
 *
 * @design 英語のお知らせは fallback 無し・noindex・動的のまま
 * 日本語（`DEFAULT_LOCALE`）は従来どおり fallback 付きのクエリ（slug ごとに
 * 要求言語 → 日本語 → その他で 1 件を選び、件数は `COUNT(DISTINCT slug)`）。
 * このクエリはアプリ向け API とダッシュボードも使うので、意味を変えずに呼ぶ。
 *
 * 日本語以外は、その言語で書いて公開した行だけ（`*Exact`）。件数も同じ行だけを
 * 数える（一覧に出ない行を数えるとページ送りに空のページが生まれる）。英語の行が
 * 無い slug の詳細は 404 にし、日本語の本文へ fallback しない — 英語の画面に
 * 日本語の本文を混ぜないため。
 *
 * 英語のページは索引させない（公開状態の表で `published-noindex`）。索引対象の
 * ページは静的生成が規約で、お知らせを静的にするには一覧のページ送り
 * （`?page=`）をパスに移し、`generateStaticParams` で全言語の公開 slug を
 * ビルド時に引く変更が要る。英訳のお知らせはまだ無く検索の受け皿にもならない
 * ので、日本語の動的 / 静的の分類（loading 境界を含む）を変えずに済む noindex を
 * 採った。言語ごとの ISR + 管理画面でのキャッシュ無効化で英語も索引させる案は
 * 採らなかった。英訳が増えて索引させたくなったら静的化を別に設計する。
 */
import type { Metadata } from "next";

import { robotsForPublication } from "@/app/_lib/metadata";
import {
  getPublishedAnnouncement,
  getPublishedAnnouncementCount,
  getPublishedAnnouncementCountExact,
  getPublishedAnnouncementExact,
  getPublishedAnnouncementsExact,
  getPublishedAnnouncementsPaginated,
} from "@/lib/announcements/queries";
import { localizedHref } from "@/i18n/public-path";
import type { Announcement } from "@/lib/db";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import { ANNOUNCEMENTS_PATH } from "@mahjong-scoring/features/routes";

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

/**
 * 一覧の n ページ目の href（ページの言語のまま）
 *
 * 1 ページ目は `?page=` を付けない（日本語の既存の出力のまま）。英語は
 * `/en/announcements?page=2` のように英語の一覧を指す。
 *
 * @param page - ページ番号（1 始まり）
 * @param locale - ページの言語
 */
export function announcementsPageHref(
  page: number,
  locale: SupportedLocale,
): string {
  return localizedHref(
    `${ANNOUNCEMENTS_PATH}${page > 1 ? `?page=${page}` : ""}`,
    locale,
  );
}

/**
 * お知らせのページの metadata に、その言語の公開状態の robots を合成する
 * お知らせの robots 合成
 *
 * 日本語は入力のまま返す（robots を足さず、hreflang もそのまま。日本語の出力を
 * 変えない）。英語は公開状態の表（`published-noindex`）から robots を引き
 * （`robotsForPublication`）、noindex で出すときは hreflang
 * （`alternates.languages`）を外して自己 canonical だけを残す。hreflang の組は
 * パス単位で、日本語が索引対象なら英語のページにも `ja`・`x-default` が載る。
 * 索引させないページから翻訳の対応を宣言すると、検索エンジンへの指示が
 * 食い違う（道場の `withPublicationRobots` と同じ扱い）。
 *
 * @param metadata - ページの言語で組んだ metadata
 * @param path - ロケール非依存のパス
 * @param locale - ページの言語
 */
export function withAnnouncementRobots(
  metadata: Metadata,
  path: string,
  locale: SupportedLocale,
): Metadata {
  if (locale === DEFAULT_LOCALE) return metadata;
  const robots = robotsForPublication(path, locale);
  if (robots === undefined) return metadata;
  const canonical = metadata.alternates?.canonical;
  return {
    ...metadata,
    robots,
    ...(canonical === undefined || canonical === null
      ? {}
      : { alternates: { canonical } }),
  };
}
