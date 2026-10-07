import Link from "next/link";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import type { Announcement } from "@/lib/db";

import { formatPublishedDate } from "../_lib/format";

interface AnnouncementTextListProps {
  readonly announcements: readonly Announcement[];
  readonly locale: string;
  /** 翻訳済みの「ピン留め」ラベル */
  readonly pinnedLabel: string;
}

/** ホームと一覧ページで共有する、公開日とタイトルを揃えたお知らせリスト。 */
export function AnnouncementTextList({
  announcements,
  locale,
  pinnedLabel,
}: AnnouncementTextListProps) {
  return (
    <ul className="divide-y divide-surface-100 overflow-hidden rounded-panel border border-panel bg-card">
      {announcements.map((announcement) => (
        <li key={announcement.id}>
          <Link
            href={`/announcements/${announcement.slug}`}
            className="group flex min-h-16 items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-5">
              <time
                dateTime={
                  announcement.publishedAt
                    ? new Date(announcement.publishedAt).toISOString()
                    : undefined
                }
                className="shrink-0 text-xs font-medium tabular-nums text-surface-500"
              >
                {formatPublishedDate(
                  announcement.publishedAt,
                  locale,
                  NUMERIC_DATE_OPTIONS,
                )}
              </time>
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-bold leading-relaxed text-foreground [overflow-wrap:anywhere]">
                  {announcement.title}
                </span>
                {announcement.pinnedAt !== null && (
                  <span className="shrink-0 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800">
                    {pinnedLabel}
                  </span>
                )}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 text-surface-400 group-hover:text-foreground"
            >
              <ChevronRightIcon />
            </span>
          </Link>
        </li>
      ))}
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
