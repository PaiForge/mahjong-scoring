"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GameSessionState } from "./use-timed-session";

/**
 * 中断の確認を開いている間だけチャレンジを止める
 * 中断中の一時停止
 *
 * 確認を開いたら止め、キャンセルで閉じたら元に戻す。開く前から一時停止
 * していたなら、閉じても止めたままにする（ユーザーが止めた状態を勝手に
 * 解かない）。カウントダウン中はセッションが一時停止を受け付けないので
 * 止めず、閉じたときも「今止まっているか」を見てから再開する — 開いた後に
 * カウントダウンが明けていても、閉じた瞬間に逆に止めてしまわないため。
 */
export function useQuitPause(gameSession: GameSessionState): {
  /** 確認を開いたときに呼ぶ */
  readonly pauseForQuit: () => void;
  /** 確認をキャンセルで閉じたときに呼ぶ */
  readonly resumeAfterQuit: () => void;
} {
  const sessionRef = useRef(gameSession);
  useEffect(() => {
    sessionRef.current = gameSession;
  });
  const wasPausedBeforeQuitRef = useRef(false);

  const pauseForQuit = useCallback(() => {
    const session = sessionRef.current;
    wasPausedBeforeQuitRef.current = session.isPaused;
    if (!session.isPaused && !session.isCountingDown) session.togglePause();
  }, []);

  const resumeAfterQuit = useCallback(() => {
    const session = sessionRef.current;
    if (!wasPausedBeforeQuitRef.current && session.isPaused) {
      session.togglePause();
    }
  }, []);

  return { pauseForQuit, resumeAfterQuit };
}
