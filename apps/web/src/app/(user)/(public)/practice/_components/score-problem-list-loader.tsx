"use client";

import { ScoreProblemListWithLinks } from "./score-problem-list-with-links";
import { useSessionStorageResult } from "../_hooks/use-session-storage-result";
import { parseQuestionResults } from "../_lib/score-question-result";

interface ScoreProblemListLoaderProps {
  readonly storageKey: string;
  readonly translationNamespace: string;
}

/**
 * 点数系チャレンジ練習の問題別フィードバック一覧 Loader（共通）
 * 点数系問題一覧ローダー
 *
 * score-calculation / score-table / mangan-score-calculation で共通。
 * Client Component。`storageKey` と `translationNamespace`（いずれも string
 * primitive）のみを props で受け取り、Server → Client 境界のシリアライズ
 * 制約（関数 props 禁止）を満たす。
 */
export function ScoreProblemListLoader({
  storageKey,
  translationNamespace,
}: ScoreProblemListLoaderProps) {
  const results = useSessionStorageResult(storageKey, parseQuestionResults);
  return (
    <ScoreProblemListWithLinks
      results={results}
      translationNamespace={translationNamespace}
    />
  );
}
