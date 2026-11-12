/**
 * 点数早見表
 *
 * @description 符×翻（20〜110 符 × 1〜4 翻）と満貫以上の点数を、親子・ロンツモで
 * 切り替えて引く表。セルをタップすると数字を隠せる（暗記用）。表の下に
 * ほかの早見表（役一覧・用語集）への行を置く（`relatedReferences`）。web と
 * 違い早見表の一覧の画面は持たず、この行が役一覧・用語集の入口になる。
 * @flow 下部タブ → 点数表。表の下の「ほかの早見表」から役一覧・用語集へ
 */
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../../components/screen";
import { RelatedReferencesSection } from "../../../reference/related-references-section";
import { ScoreTable } from "../../../score-table/score-table";

/** 切り替えの帯の位置（`Screen` の子の並びで数える）。表の上に追従させる */
const CONTROLS_INDEX = 0;

export default function ScoreTableScreen() {
  const t = useTranslations("scoreTable");

  return (
    <ScoreTable
      renderLayout={({ controls, body }) => (
        <Screen
          title={t("pageTitle")}
          contentStyle={styles.content}
          stickyHeaderIndices={[CONTROLS_INDEX]}
        >
          {controls}
          {body}
          <View style={styles.related}>
            <RelatedReferencesSection current="scoreTable" />
          </View>
        </Screen>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 0,
  },
  related: {
    marginTop: 40,
  },
});
