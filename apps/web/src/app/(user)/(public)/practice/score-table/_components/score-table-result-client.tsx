"use client";

import { useEffect, useState } from "react";
import type { PracticeResultClientProps } from "../../_lib/create-practice-result-page";
import { ResultClient } from "../../_components/result-client";
import { ScoreTableProblemList } from "./score-table-problem-list";
import type { ScoreTableQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY, parseQuestionResults } from "../_lib/types";

/**
 * 点数表ドリル専用の結果画面クライアントコンポーネント
 * 点数表結果表示
 *
 * 共通 ResultClient をラップし、問題別フィードバック一覧を children として注入する。
 * 問題結果は sessionStorage から読み取り、読み取り後にクリアする。
 */
export function ScoreTableResultClient(props: PracticeResultClientProps) {
  const [questionResults, setQuestionResults] = useState<readonly ScoreTableQuestionResult[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (stored) {
      setQuestionResults(parseQuestionResults(stored));
      sessionStorage.removeItem(RESULT_STORAGE_KEY);
    }
  }, []);

  return (
    <ResultClient {...props}>
      <ScoreTableProblemList results={questionResults} />
    </ResultClient>
  );
}
