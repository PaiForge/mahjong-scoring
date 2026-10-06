import { getTranslations } from "next-intl/server";
import { QuestionDisplay } from "../../score/_components/question-display";
import { MANGAN_SCORE_CALCULATION_DEMO_QUESTION } from "@mahjong-scoring/features/practice/mangan-score-calculation/demo-question";
import { QuestionPrompt } from "../../_components/question-prompt";
import { YakuListDisplay } from "./yaku-list-display";

/**
 * 満貫以上の点数計算の「問題方式」ビジュアルデモ
 * 満貫以上の点数計算 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況・役一覧の提示）を静的に再現し、出題形式を端的に示す。
 */
export async function ManganScoreCalculationHowToPlay() {
  const t = await getTranslations("manganScoreCalculationChallenge");

  return (
    <div className="space-y-4">
      <QuestionDisplay question={MANGAN_SCORE_CALCULATION_DEMO_QUESTION} />
      {MANGAN_SCORE_CALCULATION_DEMO_QUESTION.yakuDetails && (
        <YakuListDisplay
          yakuDetails={MANGAN_SCORE_CALCULATION_DEMO_QUESTION.yakuDetails}
        />
      )}

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
    </div>
  );
}
