import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import type {
  MobileAnnouncementSummary,
  MobileAnnouncementsResponse,
} from "@mahjong-scoring/features/announcements/mobile-api";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { AnnouncementRow } from "../../announcements/announcement-rows";
import {
  fetchAnnouncements,
  type AnnouncementApiFailure,
} from "../../announcements/announcements-api";
import {
  AnnouncementLoadFailed,
  AnnouncementLoading,
} from "../../announcements/load-state";
import { useAnnouncementRead } from "../../announcements/use-announcement-read";
import { Button } from "../../components/button";
import { LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { colors } from "../../lib/theme";

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

/** 2 ページ目以降の読み足し */
interface MorePages {
  readonly items: readonly MobileAnnouncementSummary[];
  readonly page: number;
  readonly loading: boolean;
  readonly error?: AnnouncementApiFailure;
}

function AnnouncementList() {
  const t = useTranslations("announcements");
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.announcementsIndex);
  const { state, reload } = useAnnouncementRead(
    useCallback(() => fetchAnnouncements(1), []),
  );
  // 1 ページ目を読み直したら読み足しを捨てる（重ねると同じ行が二重に並ぶ）
  const [more, setMore] = useState<{
    readonly base: MobileAnnouncementsResponse;
    readonly pages: MorePages;
  }>();
  const firstPage = state.kind === "loaded" ? state.value : undefined;
  const pages =
    more !== undefined && more.base === firstPage ? more.pages : undefined;

  if (state.kind === "loading") return <AnnouncementLoading />;
  if (state.kind === "failed")
    return (
      <AnnouncementLoadFailed message={t("loadFailed")} onRetry={reload} />
    );

  const items = [...state.value.items, ...(pages?.items ?? [])];
  const lastPage = pages?.page ?? state.value.page;
  const hasMore = lastPage < state.value.totalPages;

  const loadMore = () => {
    const base = state.value;
    setMore({
      base,
      pages: { items: pages?.items ?? [], page: lastPage, loading: true },
    });
    void fetchAnnouncements(lastPage + 1).then((result) => {
      setMore((prev) => {
        if (prev === undefined || prev.base !== base) return prev;
        if ("error" in result) {
          return {
            base,
            pages: { ...prev.pages, loading: false, error: result.error },
          };
        }
        return {
          base,
          pages: {
            items: [...prev.pages.items, ...result.items],
            page: result.page,
            loading: false,
          },
        };
      });
    });
  };

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
      {pages?.error !== undefined && (
        <AnnouncementLoadFailed message={t("loadFailed")} />
      )}
      {hasMore && (
        <Button
          variant="secondary"
          fullWidth
          testID="announcements-more"
          disabled={pages?.loading === true}
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
