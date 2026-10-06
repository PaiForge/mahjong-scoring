"use client";

import type {
  ScoreTableQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import type { RecordingPracticeBoardProps } from "../board-props";
import { useQuestionAnswer } from "../use-question-answer";
import { useTrainingAnswerVisibility } from "../use-training-mode";
import { toQuestionResult, type ScoreTableQuestionResult } from "./types";

interface UseScoreTableAnswerResult {
  readonly handleSubmit: (userAnswer: ScoreTableUserAnswer) => void;
  /**
   * 正解を出すか。トレーニングでは開示時だけでなく回答後の停止中も出す
   * （答え合わせ用）。正解のときは出さない — 選んだ値がそのまま正解で、
   * 枠の色が正誤を示している
   */
  readonly showAnswer: boolean;
}

/**
 * 点数表早引きの回答処理
 * 点数表回答
 *
 * 出題状態（{@link import("./use-score-table-question").useScoreTableQuestion}）は
 * バリアントを読む側（web はビュー、モバイルはバリアント付きの盤面）が持ち、
 * 盤面はこれで採点・記録と答え合わせの判定を行う。
 */
export function useScoreTableAnswer({
  question,
  onAdvance,
  lastAnswerCorrect,
  ...handlers
}: Pick<
  RecordingPracticeBoardProps<ScoreTableQuestionResult>,
  | "showFeedback"
  | "lastAnswerCorrect"
  | "onAnswer"
  | "onRecordResult"
  | "onPresentQuestion"
> & {
  readonly question: ScoreTableQuestion;
  /** 次の問題へ進む */
  readonly onAdvance: () => void;
}): UseScoreTableAnswerResult {
  const handleSubmit = useQuestionAnswer({
    question,
    advanceQuestion: onAdvance,
    toResult: toQuestionResult,
    ...handlers,
  });
  const { showAnswer } = useTrainingAnswerVisibility(lastAnswerCorrect);
  return { handleSubmit, showAnswer };
}
