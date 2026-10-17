"use client";

import { useEffect, useState } from "react";

/** 表示を更新する間隔（0.1 秒刻みで出すため） */
const TICK_MS = 100;

/**
 * マウントからの経過ミリ秒。`running` が false になった時点で止まる
 * 経過時間
 *
 * 計測の起点はマウント。問題ごとに `key` を変えて付け直すことで、
 * 新しい問題で 0 から数え直す（状態のリセットを effect で書かない）。
 * 回答時間の表示（web とモバイルの `AnswerTimeBadge`）が読む。
 *
 * @param running - 計測中か。false にした瞬間の値で止まる
 */
export function useElapsedMs(running: boolean): number {
  const [startedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!running) return;
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => {
      clearInterval(id);
      // 止まった瞬間の値で固定する（次の tick を待たない）
      tick();
    };
  }, [running, startedAt]);

  return elapsedMs;
}
