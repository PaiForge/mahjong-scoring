"use client";

import { useEffect, useEffectEvent } from "react";
import { useGameTimer } from "./use-game-timer";
import type { GameSessionState, TimerControl } from "./use-timed-session";

/**
 * チャレンジのシェルが持つ時計
 * チャレンジ時計
 *
 * 制限時間のタイマーを動かし、セッションのリセットにタイマーのリセットを
 * 組み込む（`registerTimerReset`）。サーバー採点の挑戦では、採点のたびに
 * 返るサーバーの時計へ合わせ直す（ずれを積み上げない。理由は
 * `TimerControl.clock` の TSDoc）。ローカル採点では `clock` が無く何もしない。
 *
 * タイマー値はシェルの中でだけ読み、100ms ごとの再レンダリングをシェルに留める。
 */
export function useChallengeClock({
  gameSession,
  timerControl,
}: {
  readonly gameSession: GameSessionState;
  readonly timerControl: TimerControl;
}): { readonly remainingSeconds: number; readonly elapsedMs: number } {
  const {
    remainingSeconds,
    elapsedMs,
    reset: resetTimer,
    sync: syncTimer,
  } = useGameTimer({
    timeLimit: gameSession.timeLimit,
    onTimeLimitReached: timerControl.onTimeLimitReached,
    isActive: timerControl.isActive,
  });

  const clock = timerControl.clock;
  useEffect(() => {
    if (clock) syncTimer(clock.elapsedMs);
  }, [clock, syncTimer]);

  // 登録関数は描画ごとに作り直されうるため、Effect Event で最新を呼ぶ
  // （依存に入れると登録のたびに effect が走り直す）
  const registerTimerReset = useEffectEvent(timerControl.registerTimerReset);
  useEffect(() => {
    registerTimerReset(resetTimer);
  }, [resetTimer]);

  return { remainingSeconds, elapsedMs };
}
