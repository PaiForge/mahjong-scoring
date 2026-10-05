"use client";

import type { ScoreTableQuestion } from "@mahjong-scoring/core";
import { FeedbackFrame } from "../../_components/feedback-frame";
import { ScoreTablePrompt } from "./score-table-prompt";
import { ScoreTableAnswerForm } from "./score-table-answer-form";
import type { ScoreTableQuestionResult } from "@mahjong-scoring/features/practice/score-table/types";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { useScoreTableAnswer } from "@mahjong-scoring/features/practice/score-table/use-score-table-answer";

interface ScoreTableBoardProps extends RecordingPracticeBoardProps<ScoreTableQuestionResult> {
  /** 現在の問題 */
  readonly question: ScoreTableQuestion;
  /** 次の問題へ進む（回答後の遷移に使用） */
  readonly onAdvance: () => void;
}

/**
 * 点数表早引きの出題盤面（条件の提示と点数の回答）
 *
 * 出題状態は呼び出し側（`useScoreTableQuestion`）が保持し、本コンポーネントは
 * 与えられた問題の提示と回答（`useScoreTableAnswer`）のみを行う。チャレンジ・トレーニング両モードで共有する。
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
  const { handleSubmit, showAnswer } = useScoreTableAnswer({
    question,
    onAdvance,
    showFeedback,
    lastAnswerCorrect,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

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
