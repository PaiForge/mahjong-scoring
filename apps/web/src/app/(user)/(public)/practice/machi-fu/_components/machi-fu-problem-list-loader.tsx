"use client";

import { createProblemListLoader } from "../../_lib/create-problem-list-loader";
import { parseMachiFuResults } from "@mahjong-scoring/features/practice/machi-fu/types";
import { MachiFuProblemList } from "./machi-fu-problem-list";

/**
 * 待ち符練習の問題別フィードバック一覧 Loader
 * 待ち符問題一覧ローダー
 */
export const MachiFuProblemListLoader = createProblemListLoader(
  parseMachiFuResults,
  MachiFuProblemList,
);
