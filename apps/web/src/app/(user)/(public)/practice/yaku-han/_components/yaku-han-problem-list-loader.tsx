"use client";

import { createProblemListLoader } from "../../_lib/create-problem-list-loader";
import { parseYakuHanResults } from "../_lib/types";
import { YakuHanProblemList } from "./yaku-han-problem-list";

/**
 * 役翻数練習の問題別フィードバック一覧 Loader
 * 役翻数問題一覧ローダー
 */
export const YakuHanProblemListLoader = createProblemListLoader(
  parseYakuHanResults,
  YakuHanProblemList,
);
