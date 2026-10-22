"use client";

import { useMemo } from "react";
import {
  useRuleSettingsStore,
  useYakumanRules,
} from "@/app/_hooks/use-rule-settings-store";
import { ScoreCalculationQuestionBoard } from "../../_components/score-calculation-question-board";
import type { ScoreCalculationQuestionResult } from "@mahjong-scoring/features/practice/score-calculation/types";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { scoreCalculationGenerateOptions } from "@mahjong-scoring/features/practice/score-calculation/generate-options";

type ScoreCalculationBoardProps =
  RecordingPracticeBoardProps<ScoreCalculationQuestionResult>;

/**
 * 点数計算の出題盤面（手牌の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 * 盤面の構図は満貫以上点数計算と共通の {@link ScoreCalculationQuestionBoard}。
 * 出題条件は {@link scoreCalculationGenerateOptions}。
 */
export function ScoreCalculationBoard(props: ScoreCalculationBoardProps) {
  const { isTraining = false } = props;
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const yakumanRules = useYakumanRules();
  const generateOptions = useMemo(
    () =>
      scoreCalculationGenerateOptions(
        { renfonpaiAs4Fu, kiriageMangan, yakumanRules },
        isTraining,
      ),
    [renfonpaiAs4Fu, kiriageMangan, yakumanRules, isTraining],
  );

  return (
    <ScoreCalculationQuestionBoard
      {...props}
      generateOptions={generateOptions}
      translationNamespace="scoreCalculationChallenge"
      boardHeight="scoreCalculation"
    />
  );
}
