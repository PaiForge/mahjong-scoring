import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
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
 * 一覧ページとダッシュボードで共有する。お知らせは読みに行くものなので、
 * 押して始める面（練習カード）の太枠 + 影ではなく行リンクで示す。
 * 見出しが「お知らせ」と言い切っている以上、全行に同じアイコンは置かない。
 */
export function AnnouncementTextList({
  announcements,
  locale,
  pinnedLabel,
}: AnnouncementTextListProps) {
  return (
    <LinkRowList>
      {announcements.map((announcement) => (
        <LinkRow
          key={announcement.id}
          href={`/announcements/${announcement.slug}`}
          leading={
            // 日付は桁を揃えて縦に並べる。等幅数字にしないと行ごとに
            // タイトルの開始位置がずれ、リストの左端が波打って見える。
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatPublishedDate(
                announcement.publishedAt,
                locale,
                NUMERIC_DATE_OPTIONS,
              )}
            </span>
          }
          title={announcement.title}
          trailing={
            announcement.pinnedAt !== null ? (
              <span className="rounded-md bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                {pinnedLabel}
              </span>
            ) : undefined
          }
        />
      ))}
    </LinkRowList>
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
