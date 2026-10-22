import { useMemo } from "react";
import { scoreCalculationGenerateOptions } from "@mahjong-scoring/features/practice/score-calculation/generate-options";
import type { ScoreCalculationQuestionResult } from "@mahjong-scoring/features/practice/score-calculation/types";

import {
  useRuleSettingsStore,
  useYakumanRules,
} from "../../../hooks/use-rule-settings-store";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { ScoreCalculationQuestionBoard } from "../../components/score-calculation-question-board";

/**
 * 点数即答の出題盤面（手牌の提示と点数の回答）
 *
 * web の `ScoreCalculationBoard` の移植。盤面の構図は満貫以上の点数計算と
 * 共通の {@link ScoreCalculationQuestionBoard}。出題条件は features の
 * {@link scoreCalculationGenerateOptions}。
 */
export function ScoreCalculationBoard(
  props: RecordingPracticeBoardProps<ScoreCalculationQuestionResult>,
) {
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
    />
  );
}
