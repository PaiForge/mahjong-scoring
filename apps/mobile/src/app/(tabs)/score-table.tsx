/**
 * 点数早見表
 *
 * @description 符×翻（20〜110 符 × 1〜4 翻）と満貫以上の点数を、親子・ロンツモで
 * 切り替えて引く表。セルをタップすると数字を隠せる（暗記用）。
 * @flow 下部タブ → 点数表。見出しの右の虫眼鏡から早見表（役一覧・用語集）へ
 */
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useTranslations } from "use-intl";
import { REFERENCE_PATH } from "@mahjong-scoring/features/routes";

import { MagnifyingGlassIcon } from "../../components/icons/icons";
import { Screen } from "../../components/screen";
import { colors } from "../../lib/theme";
import { ScoreTable } from "../../score-table/score-table";

/** 切り替えの帯の位置（`Screen` の子の並びで数える）。表の上に追従させる */
const CONTROLS_INDEX = 0;

export default function ScoreTableScreen() {
  const t = useTranslations("scoreTable");
  const tReference = useTranslations("reference");
  const router = useRouter();

  return (
    <ScoreTable
      renderLayout={({ controls, body }) => (
        <Screen
          title={t("pageTitle")}
          inTabs
          titleAction={
            // web はドロワーから早見表のハブへ行けるが、モバイルにドロワーは
            // 無いので、早見表のうち点数表を置いたこのタブから入口を出す
            <Pressable
              onPress={() => router.push(REFERENCE_PATH)}
              accessibilityRole="button"
              accessibilityLabel={tReference("title")}
              hitSlop={8}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <MagnifyingGlassIcon size={24} color={colors.surface700} />
            </Pressable>
          }
          contentStyle={styles.content}
          stickyHeaderIndices={[CONTROLS_INDEX]}
        >
          {controls}
          {body}
        </Screen>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 0,
  },
  pressed: {
    opacity: 0.5,
  },
});
