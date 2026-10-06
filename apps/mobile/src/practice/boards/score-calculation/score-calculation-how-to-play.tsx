import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { SCORE_CALCULATION_DEMO_QUESTION } from "@mahjong-scoring/features/practice/score-calculation/demo-question";

import { QuestionDisplay } from "../../components/question-display";
import { QuestionPrompt } from "../../components/question-prompt";

/**
 * 点数即答の「問題方式」ビジュアルデモ
 * 点数計算 遊び方デモ
 *
 * web の `ScoreCalculationHowToPlay` の移植。実際の出題盤面（手牌・状況の
 * 提示）を静的に再現し、出題形式を端的に示す。
 */
export function ScoreCalculationHowToPlay() {
  const t = useTranslations("scoreCalculationChallenge");
  return (
    <View style={styles.root}>
      <QuestionDisplay question={SCORE_CALCULATION_DEMO_QUESTION} />
      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
});
