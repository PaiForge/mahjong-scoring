"use client";

import { useMemo } from "react";
import { useIsClient } from "@/app/_hooks/use-is-client";
import { unpackStoredResults } from "../_lib/challenge-run";

/**
 * sessionStorage から、指定した回の問題別結果を読み取る汎用フック
 * セッションストレージ結果取得
 *
 * @param key - sessionStorage のキー
 * @param run - 結果ページの URL が指す回 ID（`?run=`）。分からなければ undefined
 * @param parse - JSON をデコードした値を型付き配列に選別する関数
 * @returns パース済みの結果配列。読み取り前（サーバー描画時とクライアント初回描画時）は `undefined`
 *
 * @remarks
 * 読んだ後も sessionStorage から消さない。消すと、結果ページから他のページへ
 * 移ってブラウザバックで戻ったときやリロードしたときに、再マウントした一覧が
 * 空の sessionStorage を読んで消える。代わりに保存の回 ID と `run` を
 * 突き合わせ、別の回の一覧を出さない（{@link unpackStoredResults}）。
 *
 * `useState` の初期化関数で読むとサーバーの描画結果（空配列）と
 * クライアント初回描画がずれてハイドレーション不一致になるため、
 * クライアント判定（`useIsClient`）が立ってから読む。効果で setState する
 * 形にしないのは、追加レンダーを避けるのと `react-hooks/set-state-in-effect`
 * に従うため（`useClientGeneratedQuestion` と同じ理由）。読み取りは破壊的で
 * なくなったので、再描画のたびに読み直しても同じ値が返る。
 *
 * 読み取り前を `undefined`、読み取り後を配列（データが無ければ空配列）として
 * 区別することで、呼び出し側は「まだ読んでいない」間だけ placeholder を出し、
 * データが存在しなかった場合（別の回の URL 等）には placeholder を出し
 * 続けずに済む。
 */
export function useSessionStorageResult<T>(
  key: string,
  run: number | undefined,
  parse: (stored: unknown) => readonly T[],
): readonly T[] | undefined {
  const isClient = useIsClient();
  return useMemo(() => {
    if (!isClient) return undefined;
    const raw = sessionStorage.getItem(key) ?? undefined;
    const stored = unpackStoredResults(raw, run);
    return stored === undefined ? [] : parse(stored);
  }, [isClient, key, run, parse]);
}
