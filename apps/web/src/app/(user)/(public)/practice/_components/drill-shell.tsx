"use client";

import { type ReactNode, memo, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/_components/content-container";
import { BoardOverlay } from "@/app/_components/board-overlay";
import { PauseIcon } from "@/app/_components/icons/pause-icon";
import { PlayIcon } from "@/app/_components/icons/play-icon";
import type { GameSessionState, TimerControl } from "../_hooks/use-timed-session";
import type { FinishCallbackArgs } from "../_hooks/use-finish-redirect";
import { useGameTimer } from "../_hooks/use-game-timer";
import { useFinishRedirect } from "../_hooks/use-finish-redirect";
import { useQuitConfirm } from "../_hooks/use-quit-confirm";
import { QuizTimer } from "./quiz-timer";
import { QuitConfirmModal } from "./quit-confirm-modal";

interface LifeIndicatorProps {
  readonly remainingLives: number;
  readonly mistakeLimit: number;
}

/** ライフ表示（ハートアイコン） */
const LifeIndicator = memo(function LifeIndicator({
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
  /** ドリル終了時に呼び出されるコールバック（スコア保存等） */
  readonly onFinish?: (args: FinishCallbackArgs) => Promise<void> | void;
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
  onFinish,
}: DrillShellProps) {
  const tc = useTranslations("challenge");

  const wasPausedBeforeQuitRef = useRef(false);

  const handleQuitOpen = useCallback(() => {
    wasPausedBeforeQuitRef.current = gameSession.isPaused;
    if (!gameSession.isPaused) {
      gameSession.togglePause();
    }
  }, [gameSession]);

  const handleQuitCancelResume = useCallback(() => {
    if (!wasPausedBeforeQuitRef.current) {
      gameSession.togglePause();
    }
  }, [gameSession]);

  const { isQuitModalOpen, handleQuitClick, handleQuitCancel, handleQuitConfirm } =
    useQuitConfirm({
      onOpen: handleQuitOpen,
      onCancel: handleQuitCancelResume,
    });

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
    finalResult: gameSession.finalResult,
    elapsedMs,
    resultPath,
    onFinish,
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
          <div className="flex items-center gap-1">
            <QuizTimer
              timeRemaining={remainingSeconds}
              progress={elapsedMs / 1000 / gameSession.timeLimit}
            />
            <button
              type="button"
              onClick={gameSession.togglePause}
              disabled={gameSession.isCountingDown || gameSession.isFinished}
              className="rounded p-1 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 disabled:opacity-40 disabled:pointer-events-none"
              aria-label={gameSession.isPaused ? tc("resume") : tc("pause")}
            >
              {gameSession.isPaused ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-surface-500">
              {tc("score")}: <span className="font-semibold text-surface-900">{gameSession.correctCount}</span>
            </span>
            <LifeIndicator
              remainingLives={gameSession.remainingLives}
              mistakeLimit={gameSession.mistakeLimit}
            />
          </div>
        </div>

        {/* Game content area - overlay scoped here to keep status bar accessible */}
        <div className="relative">
          <div className={gameSession.isPaused ? "blur-sm select-none" : undefined}>
            {children}
          </div>

          <BoardOverlay isVisible={gameSession.isPaused}>
            <button
              type="button"
              onClick={gameSession.togglePause}
              className="rounded-full bg-white/80 p-4 text-surface-700 shadow-lg transition-transform hover:scale-110 active:scale-95"
              aria-label={tc("resume")}
            >
              <PlayIcon className="size-12" />
            </button>
          </BoardOverlay>
        </div>

        {/* Quit button */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleQuitClick}
            className="text-sm text-surface-400 underline transition-colors hover:text-surface-600"
          >
            {tc("quitButton")}
          </button>
        </div>
      </div>

      <QuitConfirmModal
        isOpen={isQuitModalOpen}
        onConfirm={handleQuitConfirm}
        onCancel={handleQuitCancel}
      />
    </ContentContainer>
  );
}
