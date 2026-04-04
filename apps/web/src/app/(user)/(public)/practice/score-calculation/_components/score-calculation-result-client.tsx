"use client";

import { useEffect, useState } from "react";
import type { PracticeResultClientProps } from "../../_lib/create-practice-result-page";
import { ResultClient } from "../../_components/result-client";
import { ScoreCalculationProblemList } from "./score-calculation-problem-list";
import type { ScoreCalculationQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY, parseQuestionResults } from "../_lib/types";

/**
 * 点数計算ドリル専用の結果画面クライアントコンポーネント
 * 点数計算結果表示
 *
 * 共通 ResultClient をラップし、問題別フィードバック一覧を children として注入する。
 * 問題結果は sessionStorage から読み取り、読み取り後にクリアする。
 */
export function ScoreCalculationResultClient(props: PracticeResultClientProps) {
  const [questionResults, setQuestionResults] = useState<readonly ScoreCalculationQuestionResult[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (stored) {
      setQuestionResults(parseQuestionResults(stored));
      sessionStorage.removeItem(RESULT_STORAGE_KEY);
    }
  }, []);

  return (
    <ResultClient {...props}>
      <ScoreCalculationProblemList results={questionResults} />
    </ResultClient>
  );
}
