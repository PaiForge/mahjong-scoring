"use client";

import { useEffect, useState } from "react";

/**
 * sessionStorage から結果データを読み取り、パースし、削除する汎用フック
 * セッションストレージ結果取得
 *
 * @param key - sessionStorage のキー
 * @param parse - 生文字列を型付き配列にパースする関数
 * @returns パース済みの結果配列
 */
export function useSessionStorageResult<T>(
  key: string,
  parse: (raw: string | undefined) => readonly T[],
): readonly T[] {
  const [results, setResults] = useState<readonly T[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem(key) ?? undefined;
    if (stored !== undefined) {
      setResults(parse(stored));
      sessionStorage.removeItem(key);
    }
  }, [key, parse]);

  return results;
}
