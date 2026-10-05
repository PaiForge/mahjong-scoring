"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";

interface UseCountdownOptions {
  from?: number;
  onComplete: () => void;
}

/**
 * 開始前のカウントダウン（3, 2, 1）
 * カウントダウン
 *
 * 1 秒ごとに `from` から 0 まで数え、0 になったら `onComplete` を呼ぶ。
 * チャレンジは画面に入った直後にこれを挟んでからタイマーを動かす。
 */
export function useCountdown({ from = 3, onComplete }: UseCountdownOptions) {
  const [count, setCount] = useState(from);
  const onCountdownComplete = useEffectEvent(onComplete);

  // isActive は count から導出できるため状態として保持しない
  const isActive = count > 0;

  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, isActive]);

  useEffect(() => {
    if (count > 0) return;
    onCountdownComplete();
  }, [count]);

  const reset = useCallback(() => {
    setCount(from);
  }, [from]);

  return { count, isActive, reset };
}
