import { useMemo } from "react";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { manganScoreCalculationGenerateOptions } from "@mahjong-scoring/features/practice/score-calculation/generate-options";
import type { ManganScoreCalculationQuestionResult } from "@mahjong-scoring/features/practice/mangan-score-calculation/types";

import { useYakumanRules } from "../../../hooks/use-rule-settings-store";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { ScoreCalculationQuestionBoard } from "../../components/score-calculation-question-board";
import { YakuListDisplay } from "./yaku-list-display";

/** 手牌の直下に添える役一覧（役が無い出題では何も出さない） */
function renderYakuList(question: ScoreQuestion) {
  return question.yakuDetails && question.yakuDetails.length > 0 ? (
    <YakuListDisplay yakuDetails={question.yakuDetails} />
  ) : undefined;
}

/**
 * 満貫以上の点数計算の出題盤面（手牌・役一覧の提示と点数の回答）
 *
 * web の `ManganScoreCalculationBoard` の移植。盤面の構図は点数即答と共通の
 * {@link ScoreCalculationQuestionBoard}。満貫以上だけを出題し（features の
 * {@link manganScoreCalculationGenerateOptions}）、手牌の直下に役一覧を添える。
 */
export function ManganScoreCalculationBoard(
  props: RecordingPracticeBoardProps<ManganScoreCalculationQuestionResult>,
) {
  const { isTraining = false } = props;
  const yakumanRules = useYakumanRules();
  const generateOptions = useMemo(
    () => manganScoreCalculationGenerateOptions(yakumanRules, isTraining),
    [yakumanRules, isTraining],
  );

  return (
    <ScoreCalculationQuestionBoard
      {...props}
      generateOptions={generateOptions}
      translationNamespace="manganScoreCalculationChallenge"
      scoreRange="manganPlus"
      renderQuestionSupplement={renderYakuList}
      yakuGiven
    />
  );
}
