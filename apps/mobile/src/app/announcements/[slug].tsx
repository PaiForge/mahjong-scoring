import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTimeZone, useTranslations } from "use-intl";
import {
  ANNOUNCEMENT_DETAIL_DATE_OPTIONS,
  formatPublishedDate,
} from "@mahjong-scoring/features/announcements/format";
import { ANNOUNCEMENTS_PATH } from "@mahjong-scoring/features/routes";

import { fetchAnnouncement } from "../../announcements/announcements-api";
import { LoadFailed, LoadingIndicator } from "../../components/load-state";
import { MarkdownBody } from "../../announcements/markdown-body";
import { useAnnouncementRead } from "../../announcements/use-announcement-read";
import { SheetScreen, useReturnToIndex } from "../../components/sheet-screen";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";
import { useAppLocale } from "../../lib/use-app-locale";

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
 * 英語の端末では英訳の記事だけを読み、英訳の無い記事は「見つからない」に
 * する（日本語の本文を英語の画面に出さない）。高さを選べるシート
 * （`SheetScreen`）で出し、開いた場所の上で読んで閉じる。
 *
 * @flow ホームのお知らせ・一覧・本文のリンクから開く
 */
export default function AnnouncementScreen() {
  const t = useTranslations("announcements");
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  return (
    <SheetScreen title={t("pageTitle")} contentStyle={styles.content}>
      {typeof slug === "string" ? <Announcement slug={slug} /> : <NotFound />}
    </SheetScreen>
  );
}

function Announcement({ slug }: { readonly slug: string }) {
  const t = useTranslations("announcements");
  const locale = useAppLocale();
  const timeZone = useTimeZone();
  const { state, reload } = useAnnouncementRead(
    useCallback(() => fetchAnnouncement(slug, locale), [slug, locale]),
  );

  if (state.kind === "loading") return <LoadingIndicator />;
  if (state.kind === "failed") {
    return state.error === "notFound" ? (
      <NotFound />
    ) : (
      <LoadFailed
        message={t("loadFailed")}
        retry={{ label: t("retry"), onPress: reload }}
      />
    );
  }

  const announcement = state.value;
  const publishedDate = formatPublishedDate(
    announcement.publishedAt ?? null,
    locale,
    { ...ANNOUNCEMENT_DETAIL_DATE_OPTIONS, timeZone },
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

/**
 * 公開中でない（取り下げ・下書きに戻された）お知らせ
 *
 * 「一覧へ」は、一覧から開いたならシートを閉じて一覧へ戻り、それ以外
 * （ホームのお知らせ等）からは一覧を開く（`useReturnToIndex`）。
 */
function NotFound() {
  const t = useTranslations("announcements");
  const returnToIndex = useReturnToIndex();
  return (
    <View style={styles.notFound}>
      <Text style={styles.notFoundText}>{t("notFound")}</Text>
      <TextLink onPress={() => returnToIndex(ANNOUNCEMENTS_PATH)}>
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
