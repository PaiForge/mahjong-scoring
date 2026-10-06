import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { MANGAN_SCORE_CALCULATION_DEMO_QUESTION } from "@mahjong-scoring/features/practice/mangan-score-calculation/demo-question";

import { QuestionDisplay } from "../../components/question-display";
import { QuestionPrompt } from "../../components/question-prompt";
import { YakuListDisplay } from "./yaku-list-display";

/**
 * 満貫以上の点数計算の「問題方式」ビジュアルデモ
 * 満貫以上の点数計算 遊び方デモ
 *
 * web の `ManganScoreCalculationHowToPlay` の移植。実際の出題盤面（手牌・
 * 状況・役一覧の提示）を静的に再現し、出題形式を端的に示す。
 */
export function ManganScoreCalculationHowToPlay() {
  const t = useTranslations("manganScoreCalculationChallenge");
  const { yakuDetails } = MANGAN_SCORE_CALCULATION_DEMO_QUESTION;
  return (
    <View style={styles.root}>
      <QuestionDisplay question={MANGAN_SCORE_CALCULATION_DEMO_QUESTION} />
      {yakuDetails && <YakuListDisplay yakuDetails={yakuDetails} />}
      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
});
