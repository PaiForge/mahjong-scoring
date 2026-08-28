"use client";

import { createProblemListLoader } from "../../_lib/create-problem-list-loader";
import { parseMentsuJantouFuResults } from "../_lib/types";
import { MentsuJantouFuProblemList } from "./mentsu-jantou-fu-problem-list";

/**
 * 面子と雀頭の符練習の問題別フィードバック一覧 Loader
 * 面子雀頭符問題一覧ローダー
 */
export const MentsuJantouFuProblemListLoader = createProblemListLoader(
  parseMentsuJantouFuResults,
  MentsuJantouFuProblemList,
);
