"use client";

import { useCallback } from "react";
import type {
  ScoreTableQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { FeedbackFrame } from "../../_components/feedback-frame";
import { usePresentQuestion } from "../../_hooks/use-present-question";
import {
  useRegisterAdvance,
  useTrainingAnswerVisibility,
} from "../../_hooks/use-training-mode";
import { AnswerOutcome } from "../../_lib/result-schemas";
import { ScoreTablePrompt } from "./score-table-prompt";
import { ScoreTableAnswerForm } from "./score-table-answer-form";
import { toQuestionResult } from "../_lib/types";
import type { ScoreTableQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

interface ScoreTableBoardProps extends RecordingPracticeBoardProps<ScoreTableQuestionResult> {
  /** 現在の問題 */
  readonly question: ScoreTableQuestion;
  /** 次の問題へ進む（回答後の遷移に使用） */
  readonly onAdvance: () => void;
}

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(
  question: ScoreTableQuestion,
): ScoreTableQuestionResult {
  return toQuestionResult(question, undefined);
}

/**
 * 点数表早引きの出題盤面（条件の提示と点数の回答）
 *
 * 出題状態は呼び出し側（{@link useScoreTableQuestion}）が保持し、本コンポーネントは
 * 与えられた問題の提示と回答判定のみを行う。チャレンジ・トレーニング両モードで共有する。
 */
export function ScoreTableBoard({
  question,
  onAdvance,
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: ScoreTableBoardProps) {
  useRegisterAdvance(onAdvance);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);
  // トレーニングでは開示時だけでなく回答後の停止中も正解を出す（答え合わせ用）。
  // 正解のときは出さない — 選んだ値がそのまま正解で、枠の色が正誤を示している
  const { showAnswer } = useTrainingAnswerVisibility(lastAnswerCorrect);

  const handleSubmit = useCallback(
    (userAnswer: ScoreTableUserAnswer) => {
      if (showFeedback) return;
      const result = toQuestionResult(question, userAnswer);
      onRecordResult?.(result);
      onAnswer(result.outcome === AnswerOutcome.Correct, onAdvance);
    },
    [showFeedback, question, onAnswer, onAdvance, onRecordResult],
  );

  return (
    <div className="mt-6 space-y-6">
      {/* Question display */}
      <FeedbackFrame
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        className="space-y-4 p-6"
      >
        <ScoreTablePrompt
          isOya={question.isOya}
          isTsumo={question.isTsumo}
          han={question.han}
          fu={question.fu}
          revealedAnswer={showAnswer ? question.correctAnswer : undefined}
        />
      </FeedbackFrame>

      {/* Answer form */}
      <ScoreTableAnswerForm
        question={question}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
        isTraining={isTraining}
      />
    </div>
  );
}
