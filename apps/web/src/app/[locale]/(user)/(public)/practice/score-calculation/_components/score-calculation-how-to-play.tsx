import { getTranslations } from "next-intl/server";
import { QuestionDisplay } from "../../agari-score/_components/question-display";
import { SCORE_CALCULATION_DEMO_QUESTION } from "@mahjong-scoring/features/practice/score-calculation/demo-question";
import { QuestionPrompt } from "../../_components/question-prompt";

/**
 * 点数即答の「問題方式」ビジュアルデモ
 * 点数計算 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況の提示）を静的に再現し、出題形式を端的に示す。
 */
export async function ScoreCalculationHowToPlay() {
  const t = await getTranslations("scoreCalculationChallenge");

  return (
    <div className="space-y-4">
      <QuestionDisplay question={SCORE_CALCULATION_DEMO_QUESTION} />

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
    </div>
  );
}
