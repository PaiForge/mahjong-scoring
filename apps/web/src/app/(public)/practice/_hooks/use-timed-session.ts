"use client";

import { useCallback, useRef, useState } from "react";
import { useGameTimer } from "./use-game-timer";
import {
  CHALLENGE_TIME_LIMIT,
  MISTAKE_LIMIT,
} from "../_lib/challenge-constants";

interface UseTimedSessionOptions {
  timeLimit?: number;
  mistakeLimit?: number;
  feedbackDurationMs?: number;
}

export function useTimedSession({
  timeLimit = CHALLENGE_TIME_LIMIT,
  mistakeLimit = MISTAKE_LIMIT,
  feedbackDurationMs = 800,
}: UseTimedSessionOptions = {}) {
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | undefined>(undefined);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isFinishedRef = useRef(false);

  const handleTimeLimitReached = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFinished(true);
  }, []);

  const { remainingSeconds, elapsedMs, reset: resetTimer } = useGameTimer({
    timeLimit,
    onTimeLimitReached: handleTimeLimitReached,
    isActive: isStarted && !isFinished,
  });

  const totalCount = correctCount + incorrectCount;
  const remainingLives = Math.max(0, mistakeLimit - incorrectCount);

  const start = useCallback(() => {
    setIsStarted(true);
  }, []);

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

  const reset = useCallback(() => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsFinished(false);
    setIsStarted(false);
    setShowFeedback(false);
    setLastAnswerCorrect(undefined);
    isFinishedRef.current = false;
    resetTimer();
  }, [resetTimer]);

  return {
    isStarted,
    isFinished,
    correctCount,
    incorrectCount,
    totalCount,
    remainingLives,
    remainingSeconds,
    elapsedMs,
    showFeedback,
    lastAnswerCorrect,
    start,
    handleAnswer,
    reset,
    mistakeLimit,
  };
}
