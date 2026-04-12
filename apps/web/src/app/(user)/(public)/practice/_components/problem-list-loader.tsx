"use client";

import type { ComponentType } from "react";
import { useSessionStorageResult } from "../_hooks/use-session-storage-result";

/**
 * sessionStorage から問題別フィードバック結果を読み取り、
 * 指定された `ProblemList` コンポーネントに渡す小さな Client ラッパ
 * 問題一覧ローダー
 *
 * `createCustomResultView` が Server Component 化されたことに伴い、
 * `useSessionStorageResult`（Client hook）を呼ぶ責務をこの小さな
 * Client Component に封じ込める。Server 親の `CustomResultView` は
 * これを `<ResultView>` の `children` スロットに配置するだけでよい。
 */
interface ProblemListLoaderProps<T> {
  readonly storageKey: string;
  readonly parse: (raw: string | undefined) => readonly T[];
  readonly ProblemList: ComponentType<{ readonly results: readonly T[] }>;
}

export function ProblemListLoader<T>({
  storageKey,
  parse,
  ProblemList,
}: ProblemListLoaderProps<T>) {
  const questionResults = useSessionStorageResult(storageKey, parse);
  return <ProblemList results={questionResults} />;
}
