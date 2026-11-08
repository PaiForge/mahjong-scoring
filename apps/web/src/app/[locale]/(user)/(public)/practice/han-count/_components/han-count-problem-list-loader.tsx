"use client";

import { createProblemListLoader } from "../../_lib/create-problem-list-loader";
import { parseHanCountResults } from "@mahjong-scoring/features/practice/han-count/types";
import { HanCountProblemList } from "./han-count-problem-list";

/**
 * 翻数即答練習の問題別フィードバック一覧 Loader
 * 翻数問題一覧ローダー
 */
export const HanCountProblemListLoader = createProblemListLoader(
  parseHanCountResults,
  HanCountProblemList,
);
