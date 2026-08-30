"use client";

import { useCallback } from "react";
import { judgeScoreTableAnswer } from "@mahjong-scoring/core";
import type {
  ScoreTableQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { FeedbackFrame } from "../../_components/feedback-frame";
import { RevealedScoreAnswer } from "../../_components/revealed-score-answer";
import {
  useRegisterAdvance,
  useTrainingMode,
} from "../../_hooks/use-training-mode";
import { ScoreTablePrompt } from "./score-table-prompt";
import { ScoreTableAnswerForm } from "./score-table-answer-form";
import type { ScoreTableQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

interface ScoreTableBoardProps extends RecordingPracticeBoardProps<ScoreTableQuestionResult> {
  /** 現在の問題 */
  readonly question: ScoreTableQuestion;
  /** 次の問題へ進む（回答後の遷移に使用） */
  readonly onAdvance: () => void;
  /** 直前の回答が正解だったか（フィードバック枠の色分けに使用） */
  readonly lastAnswerCorrect?: boolean;
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
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
}: ScoreTableBoardProps) {
  useRegisterAdvance(onAdvance);
  // トレーニングでは開示時だけでなく回答後の停止中も正解を出す（答え合わせ用）
  const { isRevealed, isHolding } = useTrainingMode();

  const handleSubmit = useCallback(
    (userAnswer: ScoreTableUserAnswer) => {
      if (showFeedback) return;
      const isCorrect = judgeScoreTableAnswer(
        userAnswer,
        question.correctAnswer,
      );

      onRecordResult?.({
        isOya: question.isOya,
        isTsumo: question.isTsumo,
        han: question.han,
        fu: question.fu,
        correctAnswer: question.correctAnswer,
        userAnswer,
        isCorrect,
      });

      onAnswer(isCorrect, onAdvance);
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
        />

        {(isRevealed || isHolding) && (
          <RevealedScoreAnswer
            answer={question.correctAnswer}
            translationNamespace="scoreTableChallenge"
          />
        )}
      </FeedbackFrame>

      {/* Answer form */}
      <ScoreTableAnswerForm
        question={question}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
