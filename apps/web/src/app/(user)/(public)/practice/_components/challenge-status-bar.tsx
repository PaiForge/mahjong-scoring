"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { PauseIcon } from "@/app/(user)/_components/icons/pause-icon";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { QuizTimer } from "./quiz-timer";

interface LifeIndicatorProps {
  readonly remainingLives: number;
  readonly mistakeLimit: number;
}

/**
 * ライフ表示（ハートアイコン）
 *
 * チャレンジの画面を練習の外で見せる場所（「このアプリについて」の
 * プレビュー）も同じものを描くため公開している。
 */
export const LifeIndicator = memo(function LifeIndicatorComponent({
  remainingLives,
  mistakeLimit,
}: LifeIndicatorProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: mistakeLimit }, (_, i) => (
        <span
          key={i}
          className={`text-base ${i < remainingLives ? "text-red-500" : "text-surface-200"}`}
        >
          &#9829;
        </span>
      ))}
    </div>
  );
});

/**
 * チャレンジの盤面の上の帯（円形タイマー・一時停止・ライフ）
 * チャレンジの状態帯
 *
 * タイマーの値は 100ms ごとに変わるので、シェル（`ChallengeShell`）だけが
 * 再レンダリングされ、盤面には伝播しない（値はシェルが `useChallengeClock` で持つ）。
 */
export function ChallengeStatusBar({
  remainingSeconds,
  elapsedMs,
  timeLimit,
  isPaused,
  pauseDisabled,
  onTogglePause,
  remainingLives,
  mistakeLimit,
}: {
  readonly remainingSeconds: number;
  readonly elapsedMs: number;
  /** 制限時間（秒） */
  readonly timeLimit: number;
  readonly isPaused: boolean;
  /** カウントダウン中・終了後は一時停止を押せない */
  readonly pauseDisabled: boolean;
  readonly onTogglePause: () => void;
  readonly remainingLives: number;
  readonly mistakeLimit: number;
}) {
  const tc = useTranslations("challenge");
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-1">
        <QuizTimer
          timeRemaining={remainingSeconds}
          progress={elapsedMs / 1000 / timeLimit}
        />
        <button
          type="button"
          onClick={onTogglePause}
          disabled={pauseDisabled}
          className="rounded-md p-1 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 disabled:opacity-40 disabled:pointer-events-none"
          aria-label={isPaused ? tc("resume") : tc("pause")}
        >
          {isPaused ? (
            <PlayIcon className="size-4" />
          ) : (
            <PauseIcon className="size-4" />
          )}
        </button>
      </div>
      <LifeIndicator
        remainingLives={remainingLives}
        mistakeLimit={mistakeLimit}
      />
    </div>
  );
}
