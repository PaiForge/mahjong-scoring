/**
 * 点数早見表
 *
 * @description 符×翻（20〜110 符 × 1〜4 翻）と満貫以上の点数を、親子・ロンツモで
 * 切り替えて引く表。セルをタップすると数字を隠せる（暗記用）。
 * @flow 下部タブ → 点数表
 */
import { StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { ScoreTable } from "../../score-table/score-table";

/** 切り替えの帯の位置（`Screen` の子の並びで数える）。表の上に追従させる */
const CONTROLS_INDEX = 0;

export default function ScoreTableScreen() {
  const t = useTranslations("scoreTable");

  return (
    <ScoreTable
      renderLayout={({ controls, body }) => (
        <Screen
          title={t("pageTitle")}
          inTabs
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
});
