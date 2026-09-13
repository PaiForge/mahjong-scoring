"use client";

import { useCallback, useEffect, useRef } from "react";
import type { FinalResult } from "./use-timed-session";

/**
 * 各問題の結果を蓄積し、チャレンジ終了時に sessionStorage へ保存するフック
 * 問題結果の記録
 *
 * チャレンジ型練習の play view が共通で用いる。答えた問題の結果を ref に
 * push し、終了が確定した時点で storageKey へ JSON 保存する。
 *
 * 出題中の問題は `presentQuestion` で「回答なし」の形を預かっておく。
 * 制限時間で終わったときは、その問題を答えられなかった問題として末尾に
 * 付けて保存する — 最後の 1 問は必ず時間切れで残るので、これが無いと
 * 結果ページの一覧から最後に見ていた問題だけが消える。答えた瞬間に
 * `recordResult` が預かりを捨てるため、フィードバック表示中に時間が来ても
 * 同じ問題が二重には載らない。ミス上限で終わったときは直前に答えた問題で
 * 終わるので、預かりがあっても使わない。
 *
 * @param storageKey - sessionStorage のキー（undefined の場合は記録のみで保存しない）
 * @param finalResult - 終了スナップショット。確定するまで undefined
 */
export function useRecordedResults<T>(
  storageKey: string | undefined,
  finalResult: FinalResult | undefined,
): {
  recordResult: (result: T) => void;
  presentQuestion: (unanswered: T) => void;
} {
  const resultsRef = useRef<T[]>([]);
  const pendingRef = useRef<T | undefined>(undefined);

  const recordResult = useCallback((result: T) => {
    resultsRef.current.push(result);
    pendingRef.current = undefined;
  }, []);

  const presentQuestion = useCallback((unanswered: T) => {
    pendingRef.current = unanswered;
  }, []);

  useEffect(() => {
    if (storageKey === undefined || finalResult === undefined) return;
    const pending = pendingRef.current;
    const results =
      finalResult.reason === "timeUp" && pending !== undefined
        ? [...resultsRef.current, pending]
        : resultsRef.current;
    sessionStorage.setItem(storageKey, JSON.stringify(results));
  }, [storageKey, finalResult]);

  return { recordResult, presentQuestion };
}
