"use client";

import { createProblemListLoader } from "../../_lib/create-problem-list-loader";
import { parseMentsuFuResults } from "../_lib/types";
import { MentsuFuProblemList } from "./mentsu-fu-problem-list";

/**
 * 面子符練習の問題別フィードバック一覧 Loader
 * 面子符問題一覧ローダー
 */
export const MentsuFuProblemListLoader = createProblemListLoader(
  parseMentsuFuResults,
  MentsuFuProblemList,
);
