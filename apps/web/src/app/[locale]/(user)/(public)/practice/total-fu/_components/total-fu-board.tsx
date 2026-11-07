"use client";

import { useCallback, useMemo } from "react";
import {
  generateTotalFuQuestionInRange,
  totalFuChoices,
  type TotalFuRange,
} from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import type { TotalFuQuestionResult } from "@mahjong-scoring/features/practice/total-fu/types";
import { TotalFuQuestionBoard } from "../../_components/total-fu-question-board";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";

interface TotalFuBoardProps extends RecordingPracticeBoardProps<TotalFuQuestionResult> {
  /** 出題範囲（正解の符の上限）。選択肢もこの範囲の符に限る */
  readonly range: TotalFuRange;
}

/**
 * 合計符の出題盤面（手牌の提示と符の選択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 * 盤面の構図は昇級試験（符）と共通の {@link TotalFuQuestionBoard}。練習は
 * 端末のルール設定（連風牌4符）どおりに出題する。
 *
 * 符の内訳はトレーニングでだけ、回答した問題と「わからない」で開示した問題に
 * 対して表示する。チャレンジは制限時間内に解き続ける形式で、内訳を出しても
 * 読む間もなく次の問題へ変わってしまうため出さない。振り返りは結果ページの
 * 問題別フィードバック一覧で行う。
 */
export function TotalFuBoard({ range, ...props }: TotalFuBoardProps) {
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generateQuestion = useCallback(
    () => generateTotalFuQuestionInRange(range, { renfonpaiAs4Fu }),
    [range, renfonpaiAs4Fu],
  );
  const options = useMemo(() => totalFuChoices(range), [range]);

  return (
    <TotalFuQuestionBoard
      {...props}
      generateQuestion={generateQuestion}
      options={options}
      translationNamespace="totalFu"
      boardHeight="totalFu"
    />
  );
}
