"use client";

import type { PracticeResultClientProps } from "../../_lib/create-practice-result-page";
import { ResultClient } from "../../_components/result-client";
import { useSessionStorageResult } from "../../_hooks/use-session-storage-result";
import { ScoreCalculationProblemList } from "./score-calculation-problem-list";
import { RESULT_STORAGE_KEY, parseQuestionResults } from "../_lib/types";

/**
 * 点数計算ドリル専用の結果画面クライアントコンポーネント
 * 点数計算結果表示
 *
 * 共通 ResultClient をラップし、問題別フィードバック一覧を children として注入する。
 * 問題結果は sessionStorage から読み取り、読み取り後にクリアする。
 */
export function ScoreCalculationResultClient(props: PracticeResultClientProps) {
  const questionResults = useSessionStorageResult(RESULT_STORAGE_KEY, parseQuestionResults);

  return (
    <ResultClient {...props}>
      <ScoreCalculationProblemList results={questionResults} />
    </ResultClient>
  );
}
