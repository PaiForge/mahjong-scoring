"use client";

import { createCustomResultView } from "../../_lib/create-custom-result-view";
import { ScoreProblemListWithLinks } from "../../_components/score-problem-list-with-links";
import { RESULT_STORAGE_KEY, parseQuestionResults } from "../_lib/types";
import type { ScoreQuestionResult } from "../../_lib/score-question-result";

/**
 * 満貫以上点数計算ドリルの問題一覧（翻訳ネームスペース固定）
 * 満貫以上点数計算問題一覧
 */
function ManganScoreCalculationProblemListBound({ results }: { readonly results: readonly ScoreQuestionResult[] }) {
  return <ScoreProblemListWithLinks results={results} translationNamespace="manganScoreCalculationChallenge" />;
}

/**
 * 満貫以上点数計算ドリル専用の結果画面クライアントコンポーネント
 * 満貫以上点数計算結果表示
 *
 * 共通 ResultView をラップし、問題別フィードバック一覧を children として注入する。
 * 問題結果は sessionStorage から読み取り、読み取り後にクリアする。
 */
export const ManganScoreCalculationResultView = createCustomResultView({
  storageKey: RESULT_STORAGE_KEY,
  parse: parseQuestionResults,
  ProblemList: ManganScoreCalculationProblemListBound,
});
