"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownOptions {
  from?: number;
  onComplete: () => void;
}

export function useCountdown({ from = 3, onComplete }: UseCountdownOptions) {
  const [count, setCount] = useState(from);
  const [isActive, setIsActive] = useState(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isActive) return;

    if (count <= 0) {
      setIsActive(false);
      onCompleteRef.current();
      return;
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, isActive]);

  const reset = useCallback(() => {
    setCount(from);
    setIsActive(true);
  }, [from]);

  return { count, isActive, reset };
}
