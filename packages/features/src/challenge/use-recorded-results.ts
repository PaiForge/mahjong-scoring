"use client";

import { useCallback, useRef } from "react";

/**
 * チャレンジで答えた問題の結果を積む
 * 問題結果の記録
 *
 * 答えた問題の結果を順に積み、出題中の問題は `presentQuestion` で「回答なし」の
 * 形を預かっておく。制限時間で終わったときは、その問題を答えられなかった問題
 * として末尾に付けて返す — 最後の 1 問は必ず時間切れで残るので、これが無いと
 * 結果の一覧から最後に見ていた問題だけが消える。答えた瞬間に `recordResult` が
 * 預かりを捨てるため、フィードバック表示中に時間が来ても同じ問題が二重には
 * 載らない。ミス上限で終わったときは直前に答えた問題で終わるので、預かりが
 * あっても使わない。
 *
 * 積んだ結果をどこへ運ぶか（web は sessionStorage、モバイルはメモリのストア）は
 * 呼び出し側が `collect` で取り出して決める。
 */
export function useRecordedResults<T>(): {
  readonly recordResult: (result: T) => void;
  readonly presentQuestion: (unanswered: T) => void;
  /**
   * 積んだ結果を取り出す
   *
   * @param timeUp 制限時間で終わったか（出題中の問題を末尾に付ける）
   */
  readonly collect: (timeUp: boolean) => readonly T[];
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

  const collect = useCallback((timeUp: boolean): readonly T[] => {
    const pending = pendingRef.current;
    return timeUp && pending !== undefined
      ? [...resultsRef.current, pending]
      : [...resultsRef.current];
  }, []);

  return { recordResult, presentQuestion, collect };
}
