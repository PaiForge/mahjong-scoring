"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

/**
 * ドリル終了時に結果データを sessionStorage に保存するフック
 * セッションストレージ保存
 *
 * @param key - sessionStorage のキー
 * @param resultsRef - 結果データへの ref
 * @param isFinished - ドリルが終了したかどうか
 */
export function useSessionStorageSave<T>(
  key: string,
  resultsRef: RefObject<T[]>,
  isFinished: boolean,
): void {
  useEffect(() => {
    if (isFinished) {
      sessionStorage.setItem(key, JSON.stringify(resultsRef.current));
    }
  }, [key, resultsRef, isFinished]);
}
