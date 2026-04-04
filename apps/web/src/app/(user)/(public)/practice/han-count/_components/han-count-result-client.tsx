"use client";

import type { PracticeResultClientProps } from "../../_lib/create-practice-result-page";
import { ResultClient } from "../../_components/result-client";
import { useSessionStorageResult } from "../../_hooks/use-session-storage-result";
import { HanCountProblemList } from "./han-count-problem-list";
import { RESULT_STORAGE_KEY, parseHanCountResults } from "../_lib/types";

/**
 * 翻数即答ドリル専用の結果画面クライアントコンポーネント
 * 翻数即答結果表示
 *
 * 共通 ResultClient をラップし、問題別フィードバック一覧を children として注入する。
 * 問題結果は sessionStorage から読み取り、読み取り後にクリアする。
 */
export function HanCountResultClient(props: PracticeResultClientProps) {
  const questionResults = useSessionStorageResult(RESULT_STORAGE_KEY, parseHanCountResults);

  return (
    <ResultClient {...props}>
      <HanCountProblemList results={questionResults} />
    </ResultClient>
  );
}
