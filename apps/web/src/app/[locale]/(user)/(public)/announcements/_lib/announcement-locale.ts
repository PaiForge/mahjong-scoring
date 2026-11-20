/**
 * お知らせの一覧・詳細の、言語ごとの URL と robots
 * お知らせの言語別メタデータ
 *
 * 言語ごとの引き方（日本語は fallback 付き、それ以外はその言語の行だけ）は
 * `@/lib/announcements/locale-queries` にある。
 *
 * @design 英語のお知らせは noindex・動的のまま
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
import { localizedHref } from "@/i18n/public-path";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import { ANNOUNCEMENTS_PATH } from "@mahjong-scoring/features/routes";

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
