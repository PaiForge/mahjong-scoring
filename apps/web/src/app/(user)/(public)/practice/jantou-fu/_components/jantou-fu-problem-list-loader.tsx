"use client";

import { createProblemListLoader } from "../../_lib/create-problem-list-loader";
import { parseJantouFuResults } from "../_lib/types";
import { JantouFuProblemList } from "./jantou-fu-problem-list";

/**
 * 雀頭符練習の問題別フィードバック一覧 Loader
 * 雀頭符問題一覧ローダー
 */
export const JantouFuProblemListLoader = createProblemListLoader(
  parseJantouFuResults,
  JantouFuProblemList,
);
