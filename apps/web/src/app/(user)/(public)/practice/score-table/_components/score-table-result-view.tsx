"use client";

import type { PracticeResultViewProps } from "../../_lib/create-practice-result-page";
import { ResultView } from "../../_components/result-view";
import { useSessionStorageResult } from "../../_hooks/use-session-storage-result";
import { ScoreTableProblemList } from "./score-table-problem-list";
import { RESULT_STORAGE_KEY, parseQuestionResults } from "../_lib/types";

/**
 * 点数表ドリル専用の結果画面クライアントコンポーネント
 * 点数表結果表示
 *
 * 共通 ResultView をラップし、問題別フィードバック一覧を children として注入する。
 * 問題結果は sessionStorage から読み取り、読み取り後にクリアする。
 */
export function ScoreTableResultView(props: PracticeResultViewProps) {
  const questionResults = useSessionStorageResult(RESULT_STORAGE_KEY, parseQuestionResults);

  return (
    <ResultView {...props}>
      <ScoreTableProblemList results={questionResults} />
    </ResultView>
  );
}
