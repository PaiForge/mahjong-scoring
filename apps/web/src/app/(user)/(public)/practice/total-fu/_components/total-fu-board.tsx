"use client";

import { useCallback } from "react";
import { generateTotalFuQuestion, retryGenerate } from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { QUESTION_GENERATION_MAX_RETRIES } from "../_lib/types";
import type { TotalFuQuestionResult } from "../_lib/types";
import { TotalFuQuestionBoard } from "../../_components/total-fu-question-board";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

type TotalFuBoardProps = RecordingPracticeBoardProps<TotalFuQuestionResult>;

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
export function TotalFuBoard(props: TotalFuBoardProps) {
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generateQuestion = useCallback(
    () =>
      retryGenerate(
        () => generateTotalFuQuestion({ renfonpaiAs4Fu }),
        QUESTION_GENERATION_MAX_RETRIES,
      ),
    [renfonpaiAs4Fu],
  );

  return (
    <TotalFuQuestionBoard
      {...props}
      generateQuestion={generateQuestion}
      translationNamespace="totalFu"
      boardHeight="totalFu"
    />
  );
}
