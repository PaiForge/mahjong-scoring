"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseGameTimerOptions {
  timeLimit: number;
  onTimeLimitReached: () => void;
  isActive: boolean;
  intervalMs?: number;
}

export function useGameTimer({
  timeLimit,
  onTimeLimitReached,
  isActive,
  intervalMs = 100,
}: UseGameTimerOptions) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | undefined>(undefined);
  const accumulatedTimeRef = useRef(0);
  const onTimeLimitReachedRef = useRef(onTimeLimitReached);
  onTimeLimitReachedRef.current = onTimeLimitReached;

  useEffect(() => {
    if (!isActive) {
      if (startTimeRef.current !== undefined) {
        accumulatedTimeRef.current += Date.now() - startTimeRef.current;
        startTimeRef.current = undefined;
      }
      return;
    }

    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const total =
        accumulatedTimeRef.current + (now - (startTimeRef.current ?? now));
      setElapsedMs(total);

      if (total >= timeLimit * 1000) {
        onTimeLimitReachedRef.current();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isActive, timeLimit, intervalMs]);

  const remainingMs = Math.max(0, timeLimit * 1000 - elapsedMs);
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  const reset = useCallback(() => {
    setElapsedMs(0);
    startTimeRef.current = undefined;
    accumulatedTimeRef.current = 0;
  }, []);

  return { elapsedMs, remainingMs, remainingSeconds, reset };
}
