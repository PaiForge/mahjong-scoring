"use client";

import { ProblemListSkeleton } from "./problem-list-skeleton";
import { ScoreProblemListWithLinks } from "./score-problem-list-with-links";
import { useSessionStorageResult } from "../_hooks/use-session-storage-result";
import type { ProblemListLoaderProps } from "../_lib/problem-list-loader-props";
import { parseQuestionResults } from "../_lib/score-question-result";

interface ScoreProblemListLoaderProps extends ProblemListLoaderProps {
  /** 共通 `ScoreProblemList` に渡す翻訳名前空間 */
  readonly translationNamespace: string;
}

/**
 * 点数系チャレンジ練習の問題別フィードバック一覧 Loader（共通）
 * 点数系問題一覧ローダー
 *
 * score-calculation / score-table / mangan-score-calculation で共通。
 * Client Component。string / number の primitive のみを props で受け取り、
 * Server → Client 境界のシリアライズ制約（関数 props 禁止）を満たす。
 *
 * sessionStorage の読み取りが完了するまでは `ProblemListSkeleton` で高さを
 * 確保し、一覧が現れたときに以降のセクションが押し下げられるのを防ぐ。
 */
export function ScoreProblemListLoader({
  storageKey,
  expectedCount,
  translationNamespace,
}: ScoreProblemListLoaderProps) {
  const results = useSessionStorageResult(storageKey, parseQuestionResults);

  if (results === undefined) {
    return <ProblemListSkeleton count={expectedCount} />;
  }

  return (
    <ScoreProblemListWithLinks
      results={results}
      translationNamespace={translationNamespace}
    />
  );
}
