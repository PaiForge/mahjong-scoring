"use client";

import { useCallback } from "react";
import { generateYakuHanQuestion } from "@mahjong-scoring/core";
import type { YakuHanQuestion, YakuHanRange } from "@mahjong-scoring/core";
import type { RecordingPracticeBoardProps } from "../board-props";
import {
  useQuestionBoard,
  type UseQuestionBoardResult,
} from "../use-question-board";
import { toQuestionResult, type YakuHanQuestionResult } from "./types";

/**
 * 役翻数の練習の出題状態と回答ロジック
 * 役翻数ボード
 *
 * 出題範囲（役のフィルタ）から出題し、選んだ翻数を採点・記録して次問へ
 * 差し替える。盤面は描画だけをする。web・モバイルの両方で共有する。
 */
export function useYakuHanBoard({
  range,
  ...handlers
}: Pick<
  RecordingPracticeBoardProps<YakuHanQuestionResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
> & {
  readonly range: YakuHanRange;
}): UseQuestionBoardResult<YakuHanQuestion, number> {
  const generateQuestion = useCallback(
    (): YakuHanQuestion => generateYakuHanQuestion(range),
    [range],
  );
  return useQuestionBoard({
    generateQuestion,
    toResult: toQuestionResult,
    ...handlers,
  });
}
