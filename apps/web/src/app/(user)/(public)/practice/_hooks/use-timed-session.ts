"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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

/**
 * ゲーム終了時の確定結果
 * 終了スナップショット
 *
 * ref から取得するため、React の state バッチングやレンダーサイクルに依存せず
 * 終了時点の正確な値を保持する。
 */
export interface FinalResult {
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly totalCount: number;
}

/** ゲームロジック状態（タイマー値を含まない、ユーザー操作時のみ変化） */
export interface GameSessionState {
  readonly isCountingDown: boolean;
  readonly countdownValue: number;
  readonly isPlaying: boolean;
  readonly isFinished: boolean;
  readonly isPaused: boolean;
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly totalCount: number;
  readonly remainingLives: number;
  readonly showFeedback: boolean;
  readonly lastAnswerCorrect: boolean | undefined;
  readonly handleAnswer: (correct: boolean, onNext: () => void) => void;
  readonly togglePause: () => void;
  readonly mistakeLimit: number;
  readonly timeLimit: number;
  readonly finalResult: FinalResult | undefined;
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
  const [isPaused, setIsPaused] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<
    boolean | undefined
  >(undefined);
  const [finalResult, setFinalResult] = useState<FinalResult | undefined>(
    undefined
  );
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const isFinishedRef = useRef(false);
  const correctCountRef = useRef(0);
  const incorrectCountRef = useRef(0);
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
    const correct = correctCountRef.current;
    const incorrect = incorrectCountRef.current;
    setFinalResult({
      correctCount: correct,
      incorrectCount: incorrect,
      totalCount: correct + incorrect,
    });
    setIsFinished(true);
  }, []);

  const totalCount = correctCount + incorrectCount;
  const remainingLives = Math.max(0, mistakeLimit - incorrectCount);

  const togglePause = useCallback(() => {
    if (isFinishedRef.current || countdown.isActive) return;
    setIsPaused((prev) => !prev);
  }, [countdown.isActive]);

  const handleAnswer = useCallback(
    (correct: boolean, onNext: () => void) => {
      if (isFinishedRef.current || showFeedback || isPaused) return;

      setShowFeedback(true);
      setLastAnswerCorrect(correct);

      const newCorrectCount = correct
        ? correctCountRef.current + 1
        : correctCountRef.current;
      const newIncorrectCount = correct
        ? incorrectCountRef.current
        : incorrectCountRef.current + 1;

      correctCountRef.current = newCorrectCount;
      incorrectCountRef.current = newIncorrectCount;

      if (correct) {
        setCorrectCount((c) => c + 1);
      } else {
        setIncorrectCount(newIncorrectCount);
      }

      if (newIncorrectCount >= mistakeLimit) {
        feedbackTimeoutRef.current = setTimeout(() => {
          if (isFinishedRef.current) return;
          isFinishedRef.current = true;
          setFinalResult({
            correctCount: newCorrectCount,
            incorrectCount: newIncorrectCount,
            totalCount: newCorrectCount + newIncorrectCount,
          });
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
    [mistakeLimit, feedbackDurationMs, showFeedback, isPaused]
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
    setIsPaused(false);
    setShowFeedback(false);
    setLastAnswerCorrect(undefined);
    setFinalResult(undefined);
    isFinishedRef.current = false;
    correctCountRef.current = 0;
    incorrectCountRef.current = 0;
    timerResetRef.current?.();
    countdown.reset();
  }, [countdown]);

  const gameSession: GameSessionState = useMemo(() => ({
    isCountingDown: countdown.isActive,
    countdownValue: countdown.count,
    isPlaying: isPlaying && !isPaused,
    isFinished,
    isPaused,
    correctCount,
    incorrectCount,
    totalCount,
    remainingLives,
    showFeedback,
    lastAnswerCorrect,
    handleAnswer,
    togglePause,
    mistakeLimit,
    timeLimit,
    finalResult,
  }), [
    countdown.isActive,
    countdown.count,
    isPlaying,
    isPaused,
    isFinished,
    correctCount,
    incorrectCount,
    totalCount,
    remainingLives,
    showFeedback,
    lastAnswerCorrect,
    handleAnswer,
    togglePause,
    mistakeLimit,
    timeLimit,
    finalResult,
  ]);

  const timerControl: TimerControl = useMemo(() => ({
    isActive: isPlaying && !isFinished && !isPaused,
    onTimeLimitReached: handleTimeLimitReached,
    registerTimerReset,
    reset,
  }), [isPlaying, isFinished, isPaused, handleTimeLimitReached, registerTimerReset, reset]);

  return { gameSession, timerControl };
}
