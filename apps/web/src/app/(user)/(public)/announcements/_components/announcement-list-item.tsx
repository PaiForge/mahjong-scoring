import type { Announcement } from "@/lib/db";
import { ListLink } from "@/app/_components/list-link";

import { formatPublishedDate } from "../_lib/format";

interface AnnouncementListItemProps {
  readonly announcement: Announcement;
  readonly locale: string;
  /** 翻訳済みの「ピン留め」ラベル */
  readonly pinnedLabel: string;
}

/**
 * お知らせ一覧の1項目（公開日 + ピン留めバッジ付き ListLink）
 * お知らせ一覧アイテム
 *
 * お知らせ一覧ページとホームのお知らせセクションで共有する。
 */
export function AnnouncementListItem({
  announcement,
  locale,
  pinnedLabel,
}: AnnouncementListItemProps) {
  const publishedDate = formatPublishedDate(announcement.publishedAt, locale);

  return (
    <ListLink
      href={`/announcements/${announcement.slug}`}
      icon="📢"
      title={announcement.title}
      meta={publishedDate}
      badge={
        announcement.pinnedAt !== null ? (
          <span className="flex-shrink-0 rounded bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
            {pinnedLabel}
          </span>
        ) : undefined
      }
    />
  );
}
