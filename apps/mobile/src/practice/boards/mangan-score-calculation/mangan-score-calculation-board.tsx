import { useMemo } from "react";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { ruleBoundaryExclusions } from "@mahjong-scoring/features/challenge/rule-boundary";
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
 * {@link ScoreCalculationQuestionBoard}。満貫以上だけを出題し、手牌の直下に
 * 役一覧を添える。チャレンジではルール設定の採否で正解が割れる手を出題から
 * 落とす（features の `challenge/rule-boundary.ts`）。
 */
export function ManganScoreCalculationBoard(
  props: RecordingPracticeBoardProps<ManganScoreCalculationQuestionResult>,
) {
  const { isTraining = false } = props;
  const yakumanRules = useYakumanRules();
  const generateOptions = useMemo(
    () => ({
      allowedRanges: ["manganPlus" as const],
      yakumanRules,
      ...ruleBoundaryExclusions(isTraining),
    }),
    [yakumanRules, isTraining],
  );

  return (
    <ScoreCalculationQuestionBoard
      {...props}
      generateOptions={generateOptions}
      translationNamespace="manganScoreCalculationChallenge"
      scoreRange="manganPlus"
      renderQuestionSupplement={renderYakuList}
    />
  );
}
