"use client";

import { useMemo } from "react";
import {
  useRuleSettingsStore,
  useYakumanRules,
} from "@/app/_hooks/use-rule-settings-store";
import { ScoreCalculationQuestionBoard } from "../../_components/score-calculation-question-board";
import type { ScoreCalculationQuestionResult } from "@mahjong-scoring/features/practice/score-calculation/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";
import { ruleBoundaryExclusions } from "@mahjong-scoring/features/challenge/rule-boundary";

type ScoreCalculationBoardProps =
  RecordingPracticeBoardProps<ScoreCalculationQuestionResult>;

/**
 * 点数計算の出題盤面（手牌の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 * 盤面の構図は満貫以上点数計算と共通の {@link ScoreCalculationQuestionBoard}。
 * 点数の範囲を絞らず、端末のルール設定（連風牌4符・切り上げ満貫）どおりに出題する。
 */
export function ScoreCalculationBoard(props: ScoreCalculationBoardProps) {
  const { isTraining = false } = props;
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const yakumanRules = useYakumanRules();
  // チャレンジ（記録あり）では、ルール設定の採否で正解が割れる手を出題から
  // 落とす（理由は `_lib/rule-boundary.ts`）
  const generateOptions = useMemo(
    () => ({
      renfonpaiAs4Fu,
      kiriageMangan,
      yakumanRules,
      ...ruleBoundaryExclusions(isTraining),
    }),
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
