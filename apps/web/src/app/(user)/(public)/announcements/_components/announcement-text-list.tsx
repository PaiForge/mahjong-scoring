import Link from "next/link";

import { TEXT_LINK_MUTED_CLASSES } from "@/app/_components/_lib/link-classes";
import type { Announcement } from "@/lib/db";

import { formatPublishedDate } from "../_lib/format";

interface AnnouncementTextListProps {
  readonly announcements: readonly Announcement[];
  readonly locale: string;
  /** 翻訳済みの「ピン留め」ラベル */
  readonly pinnedLabel: string;
}

/**
 * 公開日 + タイトルだけの、枠を持たないお知らせリスト
 * お知らせテキストリスト
 *
 * ダッシュボードのように「お知らせが主役ではない」場所で使う。太枠 + 影の
 * `ListLinkContainer` は押して始めるもの（練習カード）と同じ重さを持つため、
 * 読むだけのお知らせがそれを着ると画面の重み付けが重要度と逆になる。
 * ここでは区切りの破線だけを残し、教本の目次と同じ「枠なし = 読むもの」に揃える。
 *
 * 一覧ページ（`/announcements`）ではお知らせ自体がページの主役なので、
 * 従来どおり枠付きの `AnnouncementListItem` を使う。
 */
export function AnnouncementTextList({
  announcements,
  locale,
  pinnedLabel,
}: AnnouncementTextListProps) {
  return (
    <ul className="flex flex-col">
      {announcements.map((announcement) => {
        const publishedDate = formatPublishedDate(
          announcement.publishedAt,
          locale,
          NUMERIC_DATE_OPTIONS,
        );

        return (
          <li
            key={announcement.id}
            className="flex flex-col gap-1 border-b border-dashed border-border/40 py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-3"
          >
            {publishedDate && (
              // 日付は桁を揃えて縦に並べる。等幅数字にしないと行ごとに
              // タイトルの開始位置がずれ、リストの左端が波打って見える。
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {publishedDate}
              </span>
            )}
            <span className="flex min-w-0 flex-wrap items-baseline gap-2">
              <Link
                href={`/announcements/${announcement.slug}`}
                className={`text-sm ${TEXT_LINK_MUTED_CLASSES}`}
              >
                {announcement.title}
              </Link>
              {announcement.pinnedAt !== null && (
                <span className="shrink-0 rounded-md bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                  {pinnedLabel}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 公開日の表示形式（`2026/08/20`）。
 *
 * 既定の `month: "short"`（2026年8月20日）は文字幅が日によって変わるため、
 * 日付を左端に縦に並べるこのリストでは桁揃えできる数字表記を使う。
 */
const NUMERIC_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};
