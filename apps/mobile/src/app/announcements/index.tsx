import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { AnnouncementRow } from "../../announcements/announcement-rows";
import { fetchAnnouncements } from "../../announcements/announcements-api";
import { LoadFailed, LoadingIndicator } from "../../components/load-state";
import { useAnnouncementRead } from "../../announcements/use-announcement-read";
import { Button } from "../../components/button";
import { LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { colors } from "../../lib/theme";
import { useLoadMore } from "../../lib/use-load-more";

/**
 * お知らせ一覧
 *
 * @description
 * web の `/announcements`。公開中のお知らせを web と同じ並び（ピン留めが先、
 * その中と残りは公開日の新しい順）で並べ、末尾に広告の行を混ぜる（web と
 * 同じ位置）。
 *
 * web と違うもの: ページ送りの代わりに、末尾の「さらに読み込む」で次の
 * ページを下に足す（マイレコードの全履歴と同じ）。画面に戻るたびに
 * 1 ページ目から読み直す。
 *
 * @flow ホームの「お知らせ」の「すべて見る」 → 一覧 → 各お知らせ
 */
export default function AnnouncementsScreen() {
  const t = useTranslations("announcements");
  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <AnnouncementList />
    </Screen>
  );
}

function AnnouncementList() {
  const t = useTranslations("announcements");
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.announcementsIndex);
  const { state, reload } = useAnnouncementRead(
    useCallback(() => fetchAnnouncements(1), []),
  );
  const firstPage = state.kind === "loaded" ? state.value : undefined;
  const { items, hasMore, loading, error, loadMore } = useLoadMore(
    firstPage,
    fetchAnnouncements,
  );

  if (state.kind === "loading") return <LoadingIndicator />;
  if (state.kind === "failed")
    return (
      <LoadFailed
        message={t("loadFailed")}
        retry={{ label: t("retry"), onPress: reload }}
      />
    );

  return (
    <View style={styles.section}>
      <SectionTitle>{t("listTitle")}</SectionTitle>
      {items.length === 0 ? (
        <Text style={styles.empty}>{t("empty")}</Text>
      ) : (
        <LinkRowList>
          {items.map((announcement) => (
            <AnnouncementRow
              key={announcement.slug}
              announcement={announcement}
            />
          ))}
          {ad !== undefined && <NativeAdRow creative={ad} />}
        </LinkRowList>
      )}
      {error !== undefined && <LoadFailed message={t("loadFailed")} />}
      {hasMore && (
        <Button
          variant="secondary"
          fullWidth
          testID="announcements-more"
          disabled={loading}
          onPress={loadMore}
        >
          {t("loadMore")}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
  empty: {
    fontSize: 15,
    color: colors.mutedForeground,
  },
});
