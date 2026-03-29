"use client";

interface QuizTimerProps {
  timeRemaining: number;
  progress: number;
  size?: number;
  strokeWidth?: number;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getColor(progress: number): string {
  if (progress >= 0.8) return "#ef4444";
  if (progress >= 0.6) return "#f59e0b";
  return "#22c55e";
}

export function QuizTimer({
  timeRemaining,
  progress,
  size = 48,
  strokeWidth = 4,
}: QuizTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const color = getColor(progress);

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
      <span
        className="relative z-10 text-xs font-bold"
        style={{ color }}
      >
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
}
