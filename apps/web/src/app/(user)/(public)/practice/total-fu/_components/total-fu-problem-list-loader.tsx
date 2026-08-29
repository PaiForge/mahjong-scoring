"use client";

import { FuProblemList } from "../../_components/fu-problem-list";
import { createProblemListLoader } from "../../_lib/create-problem-list-loader";
import type { ProblemListLoaderProps } from "../../_lib/problem-list-loader-props";
import { parseFuQuestionResults } from "../_lib/types";

const FuLoader = createProblemListLoader(parseFuQuestionResults, FuProblemList);

/**
 * 合計符練習の問題別フィードバック一覧 Loader
 * 合計符問題一覧ローダー
 *
 * 一覧そのもの（`FuProblemList`）は合計符を答える出題で共有するため、
 * この練習の翻訳名前空間をここで束ねる。`createCustomResultView` へ渡す
 * Loader は `storageKey` / `expectedCount` だけを受ける形でなければならない。
 */
export function TotalFuProblemListLoader(props: ProblemListLoaderProps) {
  return <FuLoader {...props} translationNamespace="totalFu" />;
}
