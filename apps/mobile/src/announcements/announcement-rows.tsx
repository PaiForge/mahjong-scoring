import { useRouter } from "expo-router";
import { useLocale, useTimeZone, useTranslations } from "use-intl";
import type { MobileAnnouncementSummary } from "@mahjong-scoring/features/announcements/mobile-api";
import { formatPublishedDate } from "@mahjong-scoring/features/announcements/format";
import { announcementHref } from "@mahjong-scoring/features/routes";

import { Chip } from "../components/chip";
import { LinkRow } from "../components/link-row";

/**
 * 一覧の日付の形（`2026/08/20`。web の一覧と同じ数字表記）。日付は
 * 端末のタイムゾーンではなく辞書の Provider のもの（日本時間）で数える
 */
const NUMERIC_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

/**
 * お知らせ 1 行（web の `AnnouncementTextList` の 1 行）
 * お知らせ行
 *
 * `LinkRowList` の中に並べる。web は日付を題名の前に置くが、狭い画面では
 * 題名を先に読ませ、日付は題名の下に添える（ネイティブの一覧の定石）。
 * ピン留めは行末の印。
 */
export function AnnouncementRow({
  announcement,
}: {
  readonly announcement: MobileAnnouncementSummary;
}) {
  const t = useTranslations("announcements");
  const router = useRouter();
  const locale = useLocale();
  const timeZone = useTimeZone();
  return (
    <LinkRow
      onPress={() => router.push(announcementHref(announcement.slug))}
      title={announcement.title}
      description={formatPublishedDate(
        announcement.publishedAt ?? null,
        locale,
        { ...NUMERIC_DATE_OPTIONS, timeZone },
      )}
      trailing={
        announcement.pinned ? (
          <Chip tone="primary">{t("pinned")}</Chip>
        ) : undefined
      }
      testID={`announcement-${announcement.slug}`}
    />
  );
}
