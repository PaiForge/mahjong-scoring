"use client";

import { useEffect, useState } from "react";

/**
 * sessionStorage から結果データを読み取り、パースし、削除する汎用フック
 * セッションストレージ結果取得
 *
 * @param key - sessionStorage のキー
 * @param parse - 生文字列を型付き配列にパースする関数
 * @returns パース済みの結果配列
 *
 * @remarks
 * `useState` の初期化関数で読むとサーバーの描画結果（空配列）と
 * クライアント初回描画がずれてハイドレーション不一致になるため、
 * 読み取りは意図的にマウント後の効果に置いている。
 * `useSyncExternalStore` は破壊的読み取り（removeItem）と
 * スナップショットの参照同一性を両立できないため使用しない。
 */
export function useSessionStorageResult<T>(
  key: string,
  parse: (raw: string | undefined) => readonly T[],
): readonly T[] {
  const [results, setResults] = useState<readonly T[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem(key) ?? undefined;
    if (stored !== undefined) {
      // ハイドレーション不一致を避けるためマウント後に一度だけ同期する（上記 @remarks 参照）
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(parse(stored));
      sessionStorage.removeItem(key);
    }
  }, [key, parse]);

  return results;
}
