import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { ANNOUNCEMENTS_PATH } from "@mahjong-scoring/features/routes";

import { AnnouncementRow } from "../announcements/announcement-rows";
import { fetchAnnouncements } from "../announcements/announcements-api";
import { useAnnouncementRead } from "../announcements/use-announcement-read";
import { LinkRowList } from "../components/link-row";
import { SectionTitle } from "../components/section-title";
import { TextLink } from "../components/text-link";
import { colors } from "../lib/theme";

/**
 * ホームに載せる件数（web のダッシュボードと同じ）
 *
 * ここはお知らせの在庫を見せる場ではなく、更新に気づくための場なので、
 * 「次にやること」より縦を食わない長さに抑える。全件は「すべて見る」から。
 */
const HOME_ANNOUNCEMENTS_LIMIT = 3;

/**
 * ホームのお知らせの節（web のダッシュボードの `HomeAnnouncements`）
 * お知らせ（ホーム）
 *
 * 一覧の 1 ページ目の先頭を数件だけ出す（並びは一覧と同じでピン留めが先）。
 * 読み込み中と読めなかったときは節ごと出さない — ホームの主役は「次に
 * やること」で、お知らせの失敗をそこに並べて見せない。
 */
export function HomeAnnouncements() {
  const t = useTranslations("announcements");
  const router = useRouter();
  const { state } = useAnnouncementRead(
    useCallback(() => fetchAnnouncements(1), []),
  );
  if (state.kind !== "loaded") return null;
  const items = state.value.items.slice(0, HOME_ANNOUNCEMENTS_LIMIT);

  return (
    <View style={styles.section}>
      <SectionTitle>{t("pageTitle")}</SectionTitle>
      {items.length === 0 ? (
        <Text style={styles.empty}>{t("empty")}</Text>
      ) : (
        <>
          <LinkRowList>
            {items.map((announcement) => (
              <AnnouncementRow
                key={announcement.slug}
                announcement={announcement}
              />
            ))}
          </LinkRowList>
          <View style={styles.viewAll}>
            <TextLink
              testID="home-announcements-all"
              onPress={() => router.push(ANNOUNCEMENTS_PATH)}
            >
              {t("viewAll")}
            </TextLink>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  viewAll: {
    alignItems: "flex-end",
  },
  empty: {
    fontSize: 15,
    color: colors.mutedForeground,
  },
});
