"use client";

import type { ComponentType, ReactNode } from "react";
import { useSessionStorageResult } from "../_hooks/use-session-storage-result";

/**
 * 問題別フィードバック一覧の Loader を生成するファクトリ
 * 問題一覧ローダー生成
 *
 * 生成される Loader は Client Component で、`storageKey` 文字列のみを
 * props で受け取る。パーサと一覧コンポーネントはファクトリ呼び出し側の
 * クライアントファイル内でハードコード import する。Server → Client 境界を
 * 越える props を「string primitive のみ」に限定することで、RSC の
 * シリアライズ制約（関数 props 禁止）を回避する。
 *
 * @param parse - sessionStorage の生文字列を型付き配列にパースする関数
 * @param ProblemList - パース済み結果を描画する一覧コンポーネント
 */
export function createProblemListLoader<T>(
  parse: (raw: string | undefined) => readonly T[],
  ProblemList: ComponentType<{ readonly results: readonly T[] }>,
): (props: { readonly storageKey: string }) => ReactNode {
  function ProblemListLoader({ storageKey }: { readonly storageKey: string }) {
    const results = useSessionStorageResult(storageKey, parse);
    return <ProblemList results={results} />;
  }
  return ProblemListLoader;
}
