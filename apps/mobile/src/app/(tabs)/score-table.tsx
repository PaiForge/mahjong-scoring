/**
 * 点数早見表
 *
 * @description 符×翻（20〜110 符 × 1〜4 翻）と満貫以上の点数を、親子・ロンツモで
 * 切り替えて引く表。セルをタップすると数字を隠せる（暗記用）。表の下に
 * ほかの早見表（役一覧・用語集）への行を置く（`RELATED_REFERENCES`）。web と
 * 違い早見表の一覧の画面は持たず、この行が役一覧・用語集の入口になる。
 * @flow 下部タブ → 点数表。表の下の「ほかの早見表」から役一覧・用語集へ
 */
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { RELATED_REFERENCES } from "@mahjong-scoring/features/score-table/related-references";

import { LinkRow, LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
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
          contentStyle={styles.content}
          stickyHeaderIndices={[CONTROLS_INDEX]}
        >
          {controls}
          {body}
          <View style={styles.related}>
            <SectionTitle>{tReference("relatedTitle")}</SectionTitle>
            <LinkRowList>
              {RELATED_REFERENCES.map(({ key, href }) => (
                <LinkRow
                  key={key}
                  testID={`score-table-related-${key}`}
                  onPress={() => router.push(href)}
                  title={tReference(`${key}.title`)}
                  description={tReference(`${key}.description`)}
                />
              ))}
            </LinkRowList>
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
    gap: 16,
  },
});
