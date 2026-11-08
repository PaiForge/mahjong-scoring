"use client";

import {
  useTimedSession as useSharedTimedSession,
  type GameSessionState,
  type TimerControl,
  type UseTimedSessionOptions,
} from "@mahjong-scoring/features/session/use-timed-session";

import { scrollToPracticeAnchor } from "../_lib/scroll-anchor";

/**
 * 練習のゲームセッション管理（web）
 * チャレンジのセッション管理
 *
 * features の `useTimedSession` に、回答で表示が切り替わったとき練習の先頭へ
 * スクロールして戻す処理を渡す。回答ボタンは盤面下端にあるため、縦に長い
 * 練習（手牌符など）では押した位置のままだと盤面上部の正誤表示も次の問題も
 * 画面外に残る。
 */
export function useTimedSession(
  options: Omit<UseTimedSessionOptions, "onDisplayChange"> = {},
): {
  gameSession: GameSessionState;
  timerControl: TimerControl;
} {
  return useSharedTimedSession({
    ...options,
    onDisplayChange: scrollToPracticeAnchor,
  });
}
