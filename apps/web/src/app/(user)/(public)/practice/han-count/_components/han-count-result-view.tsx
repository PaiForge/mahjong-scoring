"use client";

import type { PracticeResultViewProps } from "../../_lib/create-practice-result-page";
import { ResultView } from "../../_components/result-view";
import { useSessionStorageResult } from "../../_hooks/use-session-storage-result";
import { HanCountProblemList } from "./han-count-problem-list";
import { RESULT_STORAGE_KEY, parseHanCountResults } from "../_lib/types";

/**
 * 翻数即答ドリル専用の結果画面クライアントコンポーネント
 * 翻数即答結果表示
 *
 * 共通 ResultView をラップし、問題別フィードバック一覧を children として注入する。
 * 問題結果は sessionStorage から読み取り、読み取り後にクリアする。
 */
export function HanCountResultView(props: PracticeResultViewProps) {
  const questionResults = useSessionStorageResult(RESULT_STORAGE_KEY, parseHanCountResults);

  return (
    <ResultView {...props}>
      <HanCountProblemList results={questionResults} />
    </ResultView>
  );
}
