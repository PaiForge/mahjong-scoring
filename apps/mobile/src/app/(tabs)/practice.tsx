import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import {
  listedPracticeMenus,
  PRACTICE_CATEGORIES,
} from "@mahjong-scoring/features/practice/catalog";
import {
  listedPracticeRanks,
  practiceRanks,
} from "@mahjong-scoring/features/practice/rank-practices";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import type { PracticeMode } from "@mahjong-scoring/features/practice/practice-mode";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";

import { NativeAdCard } from "../../ads/native-ad-card";
import { useNativeAds } from "../../ads/use-native-ads";
import { LinkRow, LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { FilterChips } from "../../components/filter-chips";
import { ToggleGroup } from "../../components/toggle-group";
import { usePracticeModeStore } from "../../hooks/use-practice-mode-store";
import { colors } from "../../lib/theme";
import { PracticalPracticeCard } from "../../practice/components/practical-practice-card";
import { PracticeCard } from "../../practice/components/practice-card";
import { practiceScreensFor } from "../../practice/registry";
import { useGoToTab } from "../../hooks/use-go-to-tab";

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
 * web の練習一覧と同じく「基礎練習 / 実戦練習」を切り替えて見せる。基礎練習は
 * 黒帯への道（道場）への行のあと、カタログ（`PRACTICE_CATALOG`）の並びで練習
 * カードを並べ、段級位・分野で絞り込める。実戦練習は終わりのない訓練（和了形の点数計算・
 * 聴牌形の点数計算）を問題のプレビュー付きのカードで出す。最後に選んだ方を端末に
 * 覚える。昇級試験はカードにしない（入口は道場）。モバイルに盤面が無い練習は
 * まだ出さない。基礎練習のカードの並びに広告カードを 1 枚混ぜる（絞り込みの
 * 対象にはしない。web と同じ）。
 */
export default function PracticeListPage() {
  const t = useTranslations("practice");
  const tRanks = useTranslations("ranks");
  const goToTab = useGoToTab();
  const mode = usePracticeModeStore((state) => state.mode);
  const setMode = usePracticeModeStore((state) => state.setMode);
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

  // 級の指定は基礎練習の絞り込みなので、保存済みの実戦練習より優先して基礎練習に
  // 切り替える（web と同じ）。初めてタブを開いたときにも効かせるため、描画中の
  // 差し替えではなく effect で行う（端末に保存するストアを描画中に書き換えない）
  useEffect(() => {
    if (typeof rankParam === "string" && rankParam !== "") setMode("basic");
  }, [rankParam, setMode]);

  const menus = useMemo(
    () =>
      listedPracticeMenus().filter(
        (menu) => practiceScreensFor(menu.slug) !== undefined,
      ),
    [],
  );
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.practiceGrid);
  const visible = menus.filter(
    (menu) =>
      filter === ALL ||
      menu.category === filter ||
      practiceRanks(menu.slug).some((rank) => rank === filter),
  );
  const adIndex = Math.min(AD_LIST_POSITION, visible.length);

  return (
    <Screen title={t("title")} inTabs>
      <ToggleGroup<PracticeMode>
        accessibilityLabel={t("modes.label")}
        fill
        selected={mode}
        onSelect={setMode}
        groups={[
          [
            { value: "basic", label: t("modes.basic") },
            { value: "practical", label: t("modes.practical") },
          ],
        ]}
      />
      {mode === "basic" ? (
        <View style={styles.section}>
          <Text style={styles.lead}>{t("modes.basicDescription")}</Text>
          <LinkRowList>
            <LinkRow
              onPress={() => goToTab(DOJO_PATH)}
              leading={
                <Text
                  style={styles.emoji}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  🥋
                </Text>
              }
              title={t("modes.journeyTitle")}
              description={t("modes.journeyDescription")}
            />
          </LinkRowList>
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
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.leadGroup}>
            {/* 節の見出しだが中身は 1 文のリード。基礎練習の説明文と同じ大きさにそろえる（web と同じ） */}
            <Text accessibilityRole="header" style={styles.practicalLead}>
              {t("modes.practicalDescription")}
            </Text>
            <Text style={styles.lead}>{t("modes.recommendation")}</Text>
          </View>
          <View style={styles.list}>
            <PracticalPracticeCard menu="agari-score" />
            <PracticalPracticeCard menu="tenpai-score" />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 24,
  },
  leadGroup: {
    gap: 8,
  },
  lead: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 24,
    color: colors.surface500,
  },
  practicalLead: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 24,
    color: colors.surface700,
  },
  list: {
    gap: 16,
  },
  emoji: {
    fontSize: 16,
  },
});
