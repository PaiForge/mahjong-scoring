"use client";

import { useEffect, useState } from "react";
import type { PracticeResultClientProps } from "../../_lib/create-practice-result-page";
import { ResultClient } from "../../_components/result-client";
import { HanCountProblemList } from "./han-count-problem-list";
import type { HanCountQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY, parseHanCountResults } from "../_lib/types";

/**
 * 翻数即答ドリル専用の結果画面クライアントコンポーネント
 * 翻数即答結果表示
 *
 * 共通 ResultClient をラップし、問題別フィードバック一覧を children として注入する。
 * 問題結果は sessionStorage から読み取り、読み取り後にクリアする。
 */
export function HanCountResultClient(props: PracticeResultClientProps) {
  const [questionResults, setQuestionResults] = useState<readonly HanCountQuestionResult[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (stored) {
      setQuestionResults(parseHanCountResults(stored));
      sessionStorage.removeItem(RESULT_STORAGE_KEY);
    }
  }, []);

  return (
    <ResultClient {...props}>
      <HanCountProblemList results={questionResults} />
    </ResultClient>
  );
}
