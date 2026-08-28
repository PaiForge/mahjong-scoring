"use client";

import { createProblemListLoader } from "../../_lib/create-problem-list-loader";
import { parseYakuResults } from "../_lib/types";
import { YakuProblemList } from "./yaku-problem-list";

/**
 * 役選択練習の問題別フィードバック一覧 Loader
 * 役選択問題一覧ローダー
 */
export const YakuProblemListLoader = createProblemListLoader(
  parseYakuResults,
  YakuProblemList,
);
