"use client";

import { FuProblemList } from "@/app/(user)/(public)/practice/_components/fu-problem-list";
import { createProblemListLoader } from "@/app/(user)/(public)/practice/_lib/create-problem-list-loader";
import type { ProblemListLoaderProps } from "@/app/(user)/(public)/practice/_lib/problem-list-loader-props";
import { parseFuQuestionResults } from "../_lib/types";

const FuLoader = createProblemListLoader(parseFuQuestionResults, FuProblemList);

/**
 * 昇級試験（手牌の合計符）の問題別フィードバック一覧 Loader
 * 昇級試験問題一覧ローダー
 *
 * 一覧そのもの（`FuProblemList`）は合計符の練習と共有するため、この試験の
 * 翻訳名前空間をここで束ねる。
 */
export function FuExamProblemListLoader(props: ProblemListLoaderProps) {
  return <FuLoader {...props} translationNamespace="fuExamChallenge" />;
}
