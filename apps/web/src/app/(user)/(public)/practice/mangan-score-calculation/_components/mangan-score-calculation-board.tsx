"use client";

import { useMemo } from "react";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import { ScoreCalculationQuestionBoard } from "../../_components/score-calculation-question-board";
import { YakuListDisplay } from "./yaku-list-display";
import type { ManganScoreCalculationQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";
import { ruleBoundaryExclusions } from "../../_lib/rule-boundary";

type ManganScoreCalculationBoardProps =
  RecordingPracticeBoardProps<ManganScoreCalculationQuestionResult>;

/**
 * 満貫以上点数計算の出題盤面（手牌・役一覧の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 * 盤面の構図は点数計算と共通の {@link ScoreCalculationQuestionBoard}。
 * 満貫以上だけを出題し、手牌の直下に役一覧を添える。
 */
export function ManganScoreCalculationBoard(
  props: ManganScoreCalculationBoardProps,
) {
  const { isTraining = false } = props;
  const yakumanRules = useYakumanRules();
  // チャレンジ（記録あり）では、ルール設定の採否で正解が割れる手を出題から
  // 落とす（理由は `_lib/rule-boundary.ts`）
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
      boardHeight="manganScoreCalculation"
      scoreRange="manganPlus"
      renderQuestionSupplement={renderYakuList}
    />
  );
}

/** 手牌の直下に添える役一覧（役が無い出題では何も出さない） */
function renderYakuList(question: ScoreQuestion) {
  return question.yakuDetails && question.yakuDetails.length > 0 ? (
    <YakuListDisplay yakuDetails={question.yakuDetails} />
  ) : undefined;
}
