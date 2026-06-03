"use client";

import { useCallback, useMemo, useRef, useState } from "react";

interface UseTrainingSessionOptions {
  /** 正誤フィードバックの表示時間（ms） */
  feedbackDurationMs?: number;
}

/**
 * トレーニングセッション状態
 *
 * チャレンジ（{@link useTimedSession}）と異なり、制限時間・ミス上限・カウントダウンを持たない。
 * 終了はユーザーが明示的に離脱するまで発生せず、スコアも保存しない（リーダーボード非記録）。
 */
export interface TrainingSessionState {
  readonly correctCount: number;
  readonly totalCount: number;
  readonly showFeedback: boolean;
  readonly lastAnswerCorrect: boolean | undefined;
  /** 回答処理。フィードバック表示後に onNext で次問題へ進む */
  readonly handleAnswer: (correct: boolean, onNext: () => void) => void;
}

/**
 * 練習のトレーニングセッション管理
 *
 * 時間無制限・ミス無制限の反復練習用。正解数と出題数のみを集計し、
 * 回答ごとにフィードバックを挟んで次の問題へ自動で進む。
 */
export function useTrainingSession({
  feedbackDurationMs = 800,
}: UseTrainingSessionOptions = {}): TrainingSessionState {
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<
    boolean | undefined
  >(undefined);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const handleAnswer = useCallback(
    (correct: boolean, onNext: () => void) => {
      if (showFeedback) return;

      setShowFeedback(true);
      setLastAnswerCorrect(correct);
      setTotalCount((c) => c + 1);
      if (correct) setCorrectCount((c) => c + 1);

      feedbackTimeoutRef.current = setTimeout(() => {
        setShowFeedback(false);
        setLastAnswerCorrect(undefined);
        onNext();
      }, feedbackDurationMs);
    },
    [showFeedback, feedbackDurationMs]
  );

  return useMemo(
    () => ({
      correctCount,
      totalCount,
      showFeedback,
      lastAnswerCorrect,
      handleAnswer,
    }),
    [correctCount, totalCount, showFeedback, lastAnswerCorrect, handleAnswer]
  );
}
