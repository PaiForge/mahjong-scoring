"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseGameTimerOptions {
  timeLimit: number;
  onTimeLimitReached: () => void;
  isActive: boolean;
  intervalMs?: number;
}

/**
 * チャレンジの制限時間タイマー
 * ゲームタイマー
 *
 * `isActive` の間だけ経過時間を積み、止めている間（ポーズ・フィードバック中）は
 * 進めない。制限時間に達したら `onTimeLimitReached` を 1 回だけ呼ぶ。
 */
export function useGameTimer({
  timeLimit,
  onTimeLimitReached,
  isActive,
  intervalMs = 100,
}: UseGameTimerOptions) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | undefined>(undefined);
  const accumulatedTimeRef = useRef(0);
  const timeLimitFiredRef = useRef(false);
  const onTimeLimitReachedRef = useRef(onTimeLimitReached);

  useEffect(() => {
    onTimeLimitReachedRef.current = onTimeLimitReached;
  });

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

      if (!timeLimitFiredRef.current && total >= timeLimit * 1000) {
        timeLimitFiredRef.current = true;
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
    timeLimitFiredRef.current = false;
  }, []);

  /**
   * 経過時間を外部の時計（サーバー）に合わせ直す
   *
   * 動いている最中なら、合わせた値から今この瞬間を起点に数え直す。
   * 制限時間に達して通知した後は、合わせ直しで戻さない（終了は確定している）。
   * 合わせた値が制限時間を超えていれば、次の tick が通常どおり終了を通知する。
   */
  const sync = useCallback((nextElapsedMs: number) => {
    if (timeLimitFiredRef.current) return;
    accumulatedTimeRef.current = nextElapsedMs;
    if (startTimeRef.current !== undefined) startTimeRef.current = Date.now();
    setElapsedMs(nextElapsedMs);
  }, []);

  return { elapsedMs, remainingMs, remainingSeconds, reset, sync };
}
