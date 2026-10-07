import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  listedPracticeMenus,
  PRACTICE_CATEGORIES,
} from "@mahjong-scoring/features/practice/catalog";
import {
  listedPracticeRanks,
  practiceRanks,
} from "@mahjong-scoring/features/practice/rank-practices";

import { MOBILE_PRACTICE_GRID_AD_SLOT } from "@mahjong-scoring/features/ads/native-ad";
import {
  COMPREHENSIVE_PRACTICE_HREF,
  DOJO_PATH,
  MACHI_SCORE_PRACTICE_HREF,
} from "@mahjong-scoring/features/routes";

import { NativeAdCard } from "../../ads/native-ad-card";
import { useNativeAds } from "../../ads/use-native-ads";
import { LinkRow, LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { FilterChips } from "../../components/filter-chips";
import { EndlessPracticeBanner } from "../../practice/components/endless-practice-banner";
import { PracticeCard } from "../../practice/components/practice-card";
import { practiceScreensFor } from "../../practice/registry";

/** 絞り込みの値（`all` / 段級位スラッグ / カテゴリ）。web の `?rank=` / `?category=` に当たる */
type FilterValue = string;

const ALL = "all";

/**
 * 広告カードを置く位置（0 始まり）。web の練習一覧（`AD_GRID_POSITION`）と
 * 同じく上から 3 枚目。先頭に置くと一覧が広告から始まり、ずっと下に置くと
 * 絞り込んだ一覧ではほぼ出ない。表示中の練習がそれより少なければ末尾に置く
 */
const AD_LIST_POSITION = 2;

/**
 * 練習一覧
 *
 * @description
 * web の練習一覧と同じく、カタログ（`PRACTICE_CATALOG`）の並びで練習カードを
 * 並べ、段級位・分野で絞り込める。昇級試験はカードにしない（web と同じ）。
 * モバイルに盤面が無い練習はまだ出さない。広告カードを 1 枚混ぜる（絞り込みの
 * 対象にはしない）。
 */
export default function PracticeListPage() {
  const t = useTranslations("practice");
  const tRanks = useTranslations("ranks");
  const router = useRouter();
  const { rank: rankParam } = useLocalSearchParams<{ rank?: string }>();
  const [filter, setFilter] = useState<FilterValue>(() =>
    typeof rankParam === "string" && rankParam !== "" ? rankParam : ALL,
  );

  // 道場・試験の「この級の練習」から `?rank=<級>` 付きで開かれる（web の
  // `practiceListHref`）。タブは開いたまま残るので、初期値ではなく値が変わる
  // たびに合わせる（描画中に前回の値と比べて差し替える）
  const [appliedRankParam, setAppliedRankParam] = useState(rankParam);
  if (rankParam !== appliedRankParam) {
    setAppliedRankParam(rankParam);
    if (typeof rankParam === "string" && rankParam !== "") setFilter(rankParam);
  }

  const menus = useMemo(
    () =>
      listedPracticeMenus().filter(
        (menu) => practiceScreensFor(menu.slug) !== undefined,
      ),
    [],
  );
  const [ad] = useNativeAds(MOBILE_PRACTICE_GRID_AD_SLOT);
  const visible = menus.filter(
    (menu) =>
      filter === ALL ||
      menu.category === filter ||
      practiceRanks(menu.slug).some((rank) => rank === filter),
  );
  const adIndex = Math.min(AD_LIST_POSITION, visible.length);

  return (
    <Screen title={t("title")} inTabs>
      {/* 終わりのない訓練（総合演習・待ち別点数計算）。web と同じく見出しを付けない */}
      <View style={styles.banners}>
        <EndlessPracticeBanner
          href={COMPREHENSIVE_PRACTICE_HREF}
          title={t("comprehensiveBanner.title")}
          description={t("comprehensiveBanner.description")}
        />
        <EndlessPracticeBanner
          href={MACHI_SCORE_PRACTICE_HREF}
          title={t("machiScoreBanner.title")}
          description={t("machiScoreBanner.description")}
        />
      </View>
      <FilterChips
        accessibilityLabel={t("filter.label")}
        selected={filter}
        onSelect={setFilter}
        groups={[
          [{ value: ALL, label: t("filter.all") }],
          listedPracticeRanks().map((rank) => ({
            value: rank,
            label: tRanks(`names.${rank}`),
          })),
          PRACTICE_CATEGORIES.map((category) => ({
            value: category,
            label: t(`categories.${category}.short`),
          })),
        ]}
      />
      <View style={styles.list}>
        {visible.slice(0, adIndex).map((menu) => (
          <PracticeCard key={menu.slug} slug={menu.slug} />
        ))}
        {ad !== undefined && <NativeAdCard creative={ad} />}
        {visible.slice(adIndex).map((menu) => (
          <PracticeCard key={menu.slug} slug={menu.slug} />
        ))}
      </View>
      {/* 昇級試験は練習カードにしない（web と同じ）。入口は道場が持つ */}
      <LinkRowList>
        <LinkRow
          onPress={() => router.push(DOJO_PATH)}
          leading={
            <Text
              style={styles.emoji}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              🥋
            </Text>
          }
          title={t("dojoRow.title")}
          description={t("dojoRow.description")}
        />
      </LinkRowList>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  banners: {
    gap: 16,
  },
  emoji: {
    fontSize: 16,
  },
});
