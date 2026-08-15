"use client";

import { createProblemListLoader } from "../_lib/create-problem-list-loader";
import { parseQuestionResults } from "../_lib/score-question-result";
import { ScoreProblemListWithLinks } from "./score-problem-list-with-links";

/**
 * 点数系チャレンジ練習の問題別フィードバック一覧 Loader（共通）
 * 点数系問題一覧ローダー
 *
 * score-calculation / score-table / mangan-score-calculation で共通。
 * 翻訳名前空間は生成された Loader の props にそのまま現れ、一覧へ素通しされる。
 */
export const ScoreProblemListLoader = createProblemListLoader(
  parseQuestionResults,
  ScoreProblemListWithLinks,
);
