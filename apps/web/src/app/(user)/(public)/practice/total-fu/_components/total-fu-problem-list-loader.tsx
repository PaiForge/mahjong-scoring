"use client";

import { createProblemListLoader } from "../../_lib/create-problem-list-loader";
import { parseTotalFuResults } from "../_lib/types";
import { TotalFuProblemList } from "./total-fu-problem-list";

/**
 * 合計符練習の問題別フィードバック一覧 Loader
 * 合計符問題一覧ローダー
 */
export const TotalFuProblemListLoader = createProblemListLoader(
  parseTotalFuResults,
  TotalFuProblemList,
);
