"use client";

import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import type { ScoreQuestionResult } from "../results/score-question-result";
import { toScoreQuestionResult } from "../results/score-question-result";
import type { RecordingPracticeBoardProps } from "./board-props";
import { useGeneratedScoreQuestion } from "./use-generated-score-question";
import { useQuestionAnswer } from "./use-question-answer";

/** 点数計算の出題オプション */
export type ScoreQuestionGenerateOptions = Parameters<
  typeof generateValidScoreQuestion
>[0];

export interface UseScoreQuestionBoardParams extends Pick<
  RecordingPracticeBoardProps<ScoreQuestionResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
> {
  /** 出題オプション（再生成のたびに使用するため安定参照を渡すこと） */
  readonly generateOptions: ScoreQuestionGenerateOptions;
  /** 生成の最大試行回数（{@link useGeneratedScoreQuestion} の同名引数へそのまま渡す） */
  readonly maxRetries?: number;
}

interface UseScoreQuestionBoardResult {
  readonly question: ScoreQuestion | undefined;
  /** 出題番号（回答フォームを問題ごとに作り直す `key`） */
  readonly questionIndex: number;
  readonly handleSubmit: (userAnswer: ScoreTableUserAnswer) => void;
}

/**
 * 点数計算系の出題状態と回答ロジックを管理するフック
 * 点数出題ボード
 *
 * 出題（generateValidScoreQuestion）・次問への遷移・回答判定（judgeScoreTableAnswer）
 * と結果記録を内包し、score-calculation / mangan-score-calculation の盤面で共有する。
 * 出題条件の違いは `generateOptions` で吸収する。
 */
export function useScoreQuestionBoard({
  generateOptions,
  maxRetries,
  ...handlers
}: UseScoreQuestionBoardParams): UseScoreQuestionBoardResult {
  const { question, questionIndex, advanceQuestion } =
    useGeneratedScoreQuestion(generateOptions, maxRetries);
  const handleSubmit = useQuestionAnswer<
    ScoreQuestion,
    ScoreTableUserAnswer,
    ScoreQuestionResult
  >({
    question,
    advanceQuestion,
    toResult: toScoreQuestionResult,
    ...handlers,
  });

  return { question, questionIndex, handleSubmit };
}
