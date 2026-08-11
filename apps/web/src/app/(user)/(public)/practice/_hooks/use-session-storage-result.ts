"use client";

import { useEffect, useState } from "react";

/**
 * sessionStorage から結果データを読み取り、パースし、削除する汎用フック
 * セッションストレージ結果取得
 *
 * @param key - sessionStorage のキー
 * @param parse - 生文字列を型付き配列にパースする関数
 * @returns パース済みの結果配列。読み取り前（サーバー描画時とクライアント初回描画時）は `undefined`
 *
 * @remarks
 * `useState` の初期化関数で読むとサーバーの描画結果（空配列）と
 * クライアント初回描画がずれてハイドレーション不一致になるため、
 * 読み取りは意図的にマウント後の効果に置いている。
 * `useSyncExternalStore` は破壊的読み取り（removeItem）と
 * スナップショットの参照同一性を両立できないため使用しない。
 *
 * 読み取り前を `undefined`、読み取り後を配列（データが無ければ空配列）として
 * 区別することで、呼び出し側は「まだ読んでいない」間だけ placeholder を出し、
 * データが存在しなかった場合（リロード等で sessionStorage が空）には
 * placeholder を出し続けずに済む。
 */
export function useSessionStorageResult<T>(
  key: string,
  parse: (raw: string | undefined) => readonly T[],
): readonly T[] | undefined {
  const [results, setResults] = useState<readonly T[] | undefined>(undefined);

  useEffect(() => {
    const stored = sessionStorage.getItem(key) ?? undefined;
    // ハイドレーション不一致を避けるためマウント後に一度だけ同期する（上記 @remarks 参照）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResults(stored === undefined ? [] : parse(stored));
    if (stored !== undefined) {
      sessionStorage.removeItem(key);
    }
  }, [key, parse]);

  return results;
}
