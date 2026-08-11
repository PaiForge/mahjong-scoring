"use client";

import type { ComponentType, ReactNode } from "react";
import { ProblemListSkeleton } from "../_components/problem-list-skeleton";
import { useSessionStorageResult } from "../_hooks/use-session-storage-result";
import type { ProblemListLoaderProps } from "./problem-list-loader-props";

/**
 * 問題別フィードバック一覧の Loader を生成するファクトリ
 * 問題一覧ローダー生成
 *
 * 生成される Loader は Client Component で、string / number の primitive のみを
 * props で受け取る。パーサと一覧コンポーネントはファクトリ呼び出し側の
 * クライアントファイル内でハードコード import する。Server → Client 境界を
 * 越える props をシリアライズ可能な値に限定することで、RSC の
 * シリアライズ制約（関数 props 禁止）を回避する。
 *
 * sessionStorage の読み取りが完了するまでは `ProblemListSkeleton` で高さを
 * 確保し、一覧が現れたときに以降のセクションが押し下げられるのを防ぐ。
 *
 * @param parse - sessionStorage の生文字列を型付き配列にパースする関数
 * @param ProblemList - パース済み結果を描画する一覧コンポーネント
 */
export function createProblemListLoader<T>(
  parse: (raw: string | undefined) => readonly T[],
  ProblemList: ComponentType<{ readonly results: readonly T[] }>,
): (props: ProblemListLoaderProps) => ReactNode {
  function ProblemListLoader({
    storageKey,
    expectedCount,
  }: ProblemListLoaderProps) {
    const results = useSessionStorageResult(storageKey, parse);
    if (results === undefined) {
      return <ProblemListSkeleton count={expectedCount} />;
    }
    return <ProblemList results={results} />;
  }
  return ProblemListLoader;
}
