"use client";

import { memo } from "react";
import {
  formatTimerClock,
  timerColorOf,
} from "@mahjong-scoring/features/session/timer-display";

interface QuizTimerProps {
  timeRemaining: number;
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export const QuizTimer = memo(function QuizTimerComponent({
  timeRemaining,
  progress,
  size = 48,
  strokeWidth = 4,
}: QuizTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const color = timerColorOf(progress);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute top-0 left-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-surface-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-100 ease-linear"
        />
      </svg>
      <span className="relative z-10 text-xs font-bold" style={{ color }}>
        {formatTimerClock(timeRemaining)}
      </span>
    </div>
  );
});
