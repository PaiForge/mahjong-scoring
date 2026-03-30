"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/_components/content-container";
import type { GameSessionState, TimerControl } from "../_hooks/use-timed-session";
import { useGameTimer } from "../_hooks/use-game-timer";
import { useFinishRedirect } from "../_hooks/use-finish-redirect";
import { QuizTimer } from "./quiz-timer";

interface DrillShellProps {
  /** ゲームロジック状態（タイマー値を含まない） */
  readonly gameSession: GameSessionState;
  /** DrillShell 内でタイマーを制御するためのインターフェース */
  readonly timerControl: TimerControl;
  /** リザルトページへのパス（例: "/practice/jantou-fu/result"） */
  readonly resultPath: string;
  /** ドリル本体のUI */
  readonly children: ReactNode;
  /** 内部ラッパーの max-w クラス（既定: "max-w-md"） */
  readonly maxWidth?: string;
}

/**
 * ドリル共通シェル（カウントダウン・ステータスバー・ContentContainer）
 * ドリル共通外殻
 *
 * タイマー状態（elapsedMs, remainingSeconds）は DrillShell 内の useGameTimer で管理される。
 * これにより 100ms ごとのタイマー更新は DrillShell のみが再レンダリングし、
 * children（ドリル本体の牌画像・選択肢ボタン等）には伝播しない。
 */
export function DrillShell({
  gameSession,
  timerControl,
  resultPath,
  children,
  maxWidth = "max-w-md",
}: DrillShellProps) {
  const tc = useTranslations("challenge");

  const { remainingSeconds, elapsedMs, reset: resetTimer } = useGameTimer({
    timeLimit: gameSession.timeLimit,
    onTimeLimitReached: timerControl.onTimeLimitReached,
    isActive: timerControl.isActive,
  });

  // タイマーリセット関数を timerControl に登録（セッションリセット時に使用）
  const registerTimerResetRef = useRef(timerControl.registerTimerReset);
  registerTimerResetRef.current = timerControl.registerTimerReset;
  useEffect(() => {
    registerTimerResetRef.current(resetTimer);
  }, [resetTimer]);

  useFinishRedirect({
    isFinished: gameSession.isFinished,
    correctCount: gameSession.correctCount,
    totalCount: gameSession.totalCount,
    elapsedMs,
    resultPath,
  });

  if (gameSession.isFinished) {
    return undefined;
  }

  return (
    <ContentContainer>
      {/* Countdown overlay */}
      {gameSession.isCountingDown && (
        <div className="fixed inset-0 md:left-64 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <span className="text-6xl font-bold text-primary-500 animate-pulse">
            {gameSession.countdownValue}
          </span>
        </div>
      )}

      <div className={`mx-auto ${maxWidth}`}>
        {/* Status bar */}
        <div className="flex items-center justify-between text-sm">
          <QuizTimer
            timeRemaining={remainingSeconds}
            progress={elapsedMs / 1000 / gameSession.timeLimit}
          />
          <div className="flex items-center gap-3">
            <span className="text-surface-500">
              {tc("score")}: <span className="font-semibold text-surface-900">{gameSession.correctCount}</span>
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: gameSession.mistakeLimit }, (_, i) => (
                <span
                  key={i}
                  className={`text-base ${i < gameSession.remainingLives ? "text-red-500" : "text-surface-200"}`}
                >
                  &#9829;
                </span>
              ))}
            </div>
          </div>
        </div>

        {children}
      </div>
    </ContentContainer>
  );
}
