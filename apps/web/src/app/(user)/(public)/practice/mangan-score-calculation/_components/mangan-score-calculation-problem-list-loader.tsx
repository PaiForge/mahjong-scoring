"use client";

import { ScoreProblemListWithLinks } from "../../_components/score-problem-list-with-links";
import { useSessionStorageResult } from "../../_hooks/use-session-storage-result";
import { parseQuestionResults } from "../_lib/types";

interface ManganScoreCalculationProblemListLoaderProps {
  readonly storageKey: string;
}

/**
 * 満貫以上点数計算練習の問題別フィードバック一覧 Loader
 * 満貫以上点数計算問題一覧ローダー
 *
 * Client Component。`storageKey` 文字列のみを props で受け取り、
 * `parse` 関数と `ProblemList` コンポーネントはこのファイル内で
 * ハードコード import する。Server → Client 境界を越える props を
 * 「string primitive のみ」に限定することで、RSC のシリアライズ
 * 制約（関数 props 禁止）を回避する。
 */
export function ManganScoreCalculationProblemListLoader({
  storageKey,
}: ManganScoreCalculationProblemListLoaderProps) {
  const results = useSessionStorageResult(storageKey, parseQuestionResults);
  return (
    <ScoreProblemListWithLinks
      results={results}
      translationNamespace="manganScoreCalculationChallenge"
    />
  );
}
