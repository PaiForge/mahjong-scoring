import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLocale, useTimeZone, useTranslations } from "use-intl";
import { formatPublishedDate } from "@mahjong-scoring/features/announcements/format";
import { ANNOUNCEMENTS_PATH } from "@mahjong-scoring/features/routes";

import { fetchAnnouncement } from "../../announcements/announcements-api";
import {
  AnnouncementLoadFailed,
  AnnouncementLoading,
} from "../../announcements/load-state";
import { MarkdownBody } from "../../announcements/markdown-body";
import { useAnnouncementRead } from "../../announcements/use-announcement-read";
import { Screen } from "../../components/screen";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";

/** 詳細の公開日の形（`2026年8月20日`。web の詳細と同じ） */
const LONG_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

/**
 * お知らせ詳細
 *
 * @description
 * web の `/announcements/<slug>`。お知らせ 1 件の本文を Markdown として描く
 * （`MarkdownBody`）。
 *
 * web と違うもの: ヘッダーの見出しは「お知らせ」で、記事の題名は本文の
 * 先頭に大きく出す（長い題名がヘッダーで切れるため）。公開日は web では
 * 本文の後に右寄せだが、題名のすぐ下に置く（ネイティブの記事の定石）。
 *
 * @flow ホームのお知らせ・一覧・本文のリンクから開く
 */
export default function AnnouncementScreen() {
  const t = useTranslations("announcements");
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      {typeof slug === "string" ? <Announcement slug={slug} /> : <NotFound />}
    </Screen>
  );
}

function Announcement({ slug }: { readonly slug: string }) {
  const t = useTranslations("announcements");
  const locale = useLocale();
  const timeZone = useTimeZone();
  const { state, reload } = useAnnouncementRead(
    useCallback(() => fetchAnnouncement(slug), [slug]),
  );

  if (state.kind === "loading") return <AnnouncementLoading />;
  if (state.kind === "failed") {
    return state.error === "notFound" ? (
      <NotFound />
    ) : (
      <AnnouncementLoadFailed message={t("loadFailed")} onRetry={reload} />
    );
  }

  const announcement = state.value;
  const publishedDate = formatPublishedDate(
    announcement.publishedAt ?? null,
    locale,
    { ...LONG_DATE_OPTIONS, timeZone },
  );
  return (
    <>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {announcement.title}
        </Text>
        {publishedDate !== undefined && (
          <Text style={styles.date}>{publishedDate}</Text>
        )}
      </View>
      <MarkdownBody content={announcement.content} />
    </>
  );
}

/** 公開中でない（取り下げ・下書きに戻された）お知らせ */
function NotFound() {
  const t = useTranslations("announcements");
  const router = useRouter();
  return (
    <View style={styles.notFound}>
      <Text style={styles.notFoundText}>{t("notFound")}</Text>
      <TextLink onPress={() => router.navigate(ANNOUNCEMENTS_PATH)}>
        {t("backToList")}
      </TextLink>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
  },
  heading: {
    gap: 6,
  },
  title: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.foreground,
  },
  date: {
    fontSize: 13,
    color: colors.surface500,
  },
  notFound: {
    alignItems: "flex-start",
    gap: 4,
  },
  notFoundText: {
    fontSize: 15,
    color: colors.surface600,
  },
});
