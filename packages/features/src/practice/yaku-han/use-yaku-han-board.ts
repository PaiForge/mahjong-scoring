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
 * 出題範囲（役のフィルタ）から、範囲を一巡するまで同じ問題を出さずに
 * 出題し、選んだ翻数を採点・記録して次問へ差し替える。盤面は描画だけを
 * する。web・モバイルの両方で共有する。
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
    (asked: readonly YakuHanQuestion[]): YakuHanQuestion =>
      generateYakuHanQuestion(range, asked),
    [range],
  );
  return useQuestionBoard({
    generateQuestion,
    toResult: toQuestionResult,
    ...handlers,
  });
}
