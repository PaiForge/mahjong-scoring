"use client";

import { useCallback, useRef } from "react";
import { useSessionStorageSave } from "./use-session-storage-save";

/**
 * 各問題の結果を蓄積し、セッション終了時に sessionStorage へ保存するフック
 * 問題結果の記録
 *
 * チャレンジ型練習の play view が共通で用いる。結果を ref に push し、
 * isFinished が true になった時点で storageKey へ JSON 保存する。
 *
 * @param storageKey - sessionStorage のキー
 * @param isFinished - 練習が終了したかどうか
 */
export function useRecordedResults<T>(
  storageKey: string,
  isFinished: boolean,
): { recordResult: (result: T) => void } {
  const resultsRef = useRef<T[]>([]);

  const recordResult = useCallback((result: T) => {
    resultsRef.current.push(result);
  }, []);

  useSessionStorageSave(storageKey, resultsRef, isFinished);

  return { recordResult };
}
