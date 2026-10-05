import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { MACHI_SCORE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";

import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { useMachiScoreSettingsStore } from "../../../hooks/use-score-settings-store";
import { colors } from "../../../lib/theme";
import { useMachiScoreStore } from "../../../practice/endless/machi-score/use-machi-score-store";
import { ScoreSetupForm } from "../../../practice/endless/score/score-setup-form";

/**
 * 待ち別点数計算 設定
 *
 * @description
 * 待ち別点数計算の設定画面。聴牌形から待ち牌を読み、待ちごとにツモ・ロンの
 * 点数を答える練習で、設定項目は総合演習と同じ（保存先だけ分ける）。役の
 * 絞り込みは持たない — 待ちごとに役が変わる出題で「どの待ちに掛けるか」を
 * 定められないため。出題範囲の但し書きは開始ボタンの下に脚注として出す。
 *
 * @flow
 * 1. 練習一覧のバナーから遷移
 * 2. 設定を選ぶ（端末に保存される）
 * 3. 「開始する」で play 画面へ
 */
export default function MachiScoreSetupPage() {
  const t = useTranslations("machiScore");
  const tp = useTranslations("practice");

  return (
    <Screen title={t("title")} back>
      <View style={styles.section}>
        <SectionTitle>{tp("settingsTitle")}</SectionTitle>
        <ScoreSetupForm
          settingsStore={useMachiScoreSettingsStore}
          playPath={`${MACHI_SCORE_PRACTICE_HREF}/play`}
          onStart={() => useMachiScoreStore.getState().setQuestion(undefined)}
          showYakuFilter={false}
        >
          {/* 始める前に読ませる告知ではなく、「なぜこの形しか出ないのか」を
              引くための脚注（web と同じ） */}
          <View style={styles.notes}>
            <Text style={styles.note}>{t("notes.mentsuOnly")}</Text>
            <Text style={styles.note}>{t("notes.multiWait")}</Text>
          </View>
        </ScoreSetupForm>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  notes: {
    gap: 2,
  },
  note: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.surface500,
  },
});
