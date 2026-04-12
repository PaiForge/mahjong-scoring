"use client";

import { createCustomResultView } from "../../_lib/create-custom-result-view";
import { HanCountProblemList } from "./han-count-problem-list";
import { RESULT_STORAGE_KEY, parseHanCountResults } from "../_lib/types";

/**
 * 翻数即答ドリル専用の結果画面クライアントコンポーネント
 * 翻数即答結果表示
 *
 * 共通 ResultView をラップし、問題別フィードバック一覧を children として注入する。
 * 問題結果は sessionStorage から読み取り、読み取り後にクリアする。
 */
export const HanCountResultView = createCustomResultView({
  storageKey: RESULT_STORAGE_KEY,
  parse: parseHanCountResults,
  ProblemList: HanCountProblemList,
});
