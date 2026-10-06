import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { COMPREHENSIVE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";

import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { useScoreSettingsStore } from "../../../hooks/use-score-settings-store";
import { RelatedLessonsSection } from "../../../practice/endless/related-lessons-section";
import { ScoreSetupForm } from "../../../practice/endless/score/score-setup-form";
import { useScorePracticeStore } from "../../../practice/endless/score/use-score-practice-store";

/**
 * 点数計算総合演習 設定
 *
 * @description
 * 点数計算総合演習の設定画面。時計もミス上限も無く好きなだけ解ける練習で、
 * 始める前に役の回答・満貫の簡略化・符の入力・自動で次へ・親子・点数帯・
 * 出題する役を選ぶ。下に点数の計算セクションのレッスンを並べる。
 *
 * @flow
 * 1. 練習一覧のバナーから遷移
 * 2. 設定を選ぶ（端末に保存され、次回も同じ設定で始まる）
 * 3. 「開始する」で play 画面へ
 */
export default function ScoreSetupPage() {
  const t = useTranslations("score");
  const tp = useTranslations("practice");

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <View style={styles.section}>
        <SectionTitle>{tp("settingsTitle")}</SectionTitle>
        <ScoreSetupForm
          settingsStore={useScoreSettingsStore}
          playPath={`${COMPREHENSIVE_PRACTICE_HREF}/play`}
          onStart={() =>
            useScorePracticeStore.getState().setQuestion(undefined)
          }
        />
      </View>

      {/* 点数の計算セクションの章はどれも本文の導線でこの練習へ送る。戻る先を
          その章にそろえる（web と同じ） */}
      <RelatedLessonsSection section="score" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
});
