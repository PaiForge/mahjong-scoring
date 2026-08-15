"use client";

import type { ComponentType, ReactNode } from "react";
import { ProblemListSkeleton } from "../_components/problem-list-skeleton";
import { useSessionStorageResult } from "../_hooks/use-session-storage-result";
import type { ProblemListLoaderProps } from "./problem-list-loader-props";

/** 問題別フィードバック一覧コンポーネントが満たすべき props の形 */
interface ProblemListProps {
  readonly results: readonly unknown[];
}

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
 * 一覧が `results` 以外の props（翻訳名前空間など）を要求する場合、それらは
 * 生成された Loader の props にそのまま現れ、素通しされる。同じシリアライズ
 * 制約が掛かるため primitive に限ること。
 *
 * sessionStorage の読み取りが完了するまでは `ProblemListSkeleton` で高さを
 * 確保し、一覧が現れたときに以降のセクションが押し下げられるのを防ぐ。
 *
 * @param parse - sessionStorage の生文字列を型付き配列にパースする関数
 * @param ProblemList - パース済み結果を描画する一覧コンポーネント
 */
export function createProblemListLoader<TListProps extends ProblemListProps>(
  parse: (raw: string | undefined) => TListProps["results"],
  ProblemList: ComponentType<TListProps>,
): (props: ProblemListLoaderProps & Omit<TListProps, "results">) => ReactNode {
  function ProblemListLoader({
    storageKey,
    expectedCount,
    ...extraProps
  }: ProblemListLoaderProps & Omit<TListProps, "results">) {
    const results = useSessionStorageResult(storageKey, parse);
    if (results === undefined) {
      return <ProblemListSkeleton count={expectedCount} />;
    }
    // `Omit<TListProps, "results">` に results を戻した形は TListProps と同一だが、
    // ジェネリックのまま差分を足し戻す推論は TS が追えないため unknown 経由で通す。
    const listProps = { ...extraProps, results } as unknown as TListProps;
    return <ProblemList {...listProps} />;
  }
  return ProblemListLoader;
}
