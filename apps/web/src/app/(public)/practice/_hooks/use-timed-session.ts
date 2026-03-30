"use client";

import { useCallback, useRef, useState } from "react";
import { useCountdown } from "./use-countdown";
import {
  CHALLENGE_TIME_LIMIT,
  MISTAKE_LIMIT,
} from "../_lib/challenge-constants";

interface UseTimedSessionOptions {
  timeLimit?: number;
  mistakeLimit?: number;
  feedbackDurationMs?: number;
  countdownFrom?: number;
}

/** ゲームロジック状態（タイマー値を含まない、ユーザー操作時のみ変化） */
export interface GameSessionState {
  readonly isCountingDown: boolean;
  readonly countdownValue: number;
  readonly isPlaying: boolean;
  readonly isFinished: boolean;
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly totalCount: number;
  readonly remainingLives: number;
  readonly showFeedback: boolean;
  readonly lastAnswerCorrect: boolean | undefined;
  readonly handleAnswer: (correct: boolean, onNext: () => void) => void;
  readonly mistakeLimit: number;
  readonly timeLimit: number;
}

/** DrillShell がタイマーを制御するためのインターフェース */
export interface TimerControl {
  /** タイマーを動かすべきか */
  readonly isActive: boolean;
  /** 制限時間到達時のコールバック */
  readonly onTimeLimitReached: () => void;
  /** タイマーをリセットする関数（reset に組み込むため DrillShell に渡す） */
  readonly registerTimerReset: (resetFn: () => void) => void;
  /** セッション全体をリセット */
  readonly reset: () => void;
}

/**
 * ドリルのゲームセッション管理
 *
 * タイマー値（elapsedMs, remainingSeconds）を含まないため、100ms ごとの再レンダリングが発生しない。
 * タイマー表示は DrillShell 内で useGameTimer を呼び出し、DrillShell のみが再レンダリングされる。
 */
export function useTimedSession({
  timeLimit = CHALLENGE_TIME_LIMIT,
  mistakeLimit = MISTAKE_LIMIT,
  feedbackDurationMs = 800,
  countdownFrom = 3,
}: UseTimedSessionOptions = {}): {
  gameSession: GameSessionState;
  timerControl: TimerControl;
} {
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<
    boolean | undefined
  >(undefined);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const isFinishedRef = useRef(false);
  const timerResetRef = useRef<(() => void) | undefined>(undefined);

  const handleCountdownComplete = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const countdown = useCountdown({
    from: countdownFrom,
    onComplete: handleCountdownComplete,
  });

  const handleTimeLimitReached = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFinished(true);
  }, []);

  const totalCount = correctCount + incorrectCount;
  const remainingLives = Math.max(0, mistakeLimit - incorrectCount);

  const handleAnswer = useCallback(
    (correct: boolean, onNext: () => void) => {
      if (isFinishedRef.current || showFeedback) return;

      setShowFeedback(true);
      setLastAnswerCorrect(correct);

      const newIncorrectCount = correct ? incorrectCount : incorrectCount + 1;

      if (correct) {
        setCorrectCount((c) => c + 1);
      } else {
        setIncorrectCount(newIncorrectCount);
      }

      if (newIncorrectCount >= mistakeLimit) {
        feedbackTimeoutRef.current = setTimeout(() => {
          isFinishedRef.current = true;
          setIsFinished(true);
          setShowFeedback(false);
        }, feedbackDurationMs);
        return;
      }

      feedbackTimeoutRef.current = setTimeout(() => {
        if (isFinishedRef.current) return;
        setShowFeedback(false);
        setLastAnswerCorrect(undefined);
        onNext();
      }, feedbackDurationMs);
    },
    [incorrectCount, mistakeLimit, feedbackDurationMs, showFeedback]
  );

  const registerTimerReset = useCallback((resetFn: () => void) => {
    timerResetRef.current = resetFn;
  }, []);

  const reset = useCallback(() => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsFinished(false);
    setIsPlaying(false);
    setShowFeedback(false);
    setLastAnswerCorrect(undefined);
    isFinishedRef.current = false;
    timerResetRef.current?.();
    countdown.reset();
  }, [countdown]);

  const gameSession: GameSessionState = {
    isCountingDown: countdown.isActive,
    countdownValue: countdown.count,
    isPlaying,
    isFinished,
    correctCount,
    incorrectCount,
    totalCount,
    remainingLives,
    showFeedback,
    lastAnswerCorrect,
    handleAnswer,
    mistakeLimit,
    timeLimit,
  };

  const timerControl: TimerControl = {
    isActive: isPlaying && !isFinished,
    onTimeLimitReached: handleTimeLimitReached,
    registerTimerReset,
    reset,
  };

  return { gameSession, timerControl };
}
