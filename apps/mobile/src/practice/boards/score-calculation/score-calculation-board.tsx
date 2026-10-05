import { useMemo } from "react";
import { ruleBoundaryExclusions } from "@mahjong-scoring/features/challenge/rule-boundary";
import type { ScoreCalculationQuestionResult } from "@mahjong-scoring/features/practice/score-calculation/types";

import {
  useRuleSettingsStore,
  useYakumanRules,
} from "../../../hooks/use-rule-settings-store";
import type { RecordingPracticeBoardProps } from "../../board-props";
import { ScoreCalculationQuestionBoard } from "../../components/score-calculation-question-board";

/**
 * 点数即答の出題盤面（手牌の提示と点数の回答）
 *
 * web の `ScoreCalculationBoard` の移植。盤面の構図は満貫以上の点数計算と
 * 共通の {@link ScoreCalculationQuestionBoard}。点数の範囲を絞らず、端末の
 * ルール設定（連風牌4符・切り上げ満貫）どおりに出題する。チャレンジでは
 * ルール設定の採否で正解が割れる手を出題から落とす
 * （features の `challenge/rule-boundary.ts`）。
 */
export function ScoreCalculationBoard(
  props: RecordingPracticeBoardProps<ScoreCalculationQuestionResult>,
) {
  const { isTraining = false } = props;
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const yakumanRules = useYakumanRules();
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
    />
  );
}
