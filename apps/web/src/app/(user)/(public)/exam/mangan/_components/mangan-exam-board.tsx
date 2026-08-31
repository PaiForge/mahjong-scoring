"use client";

import { createScoreExamBoard } from "../../_lib/create-score-exam-board";
import {
  EXAM_GENERATE_OPTIONS,
  EXAM_GENERATION_MAX_RETRIES,
} from "../_lib/types";

/**
 * 昇級試験（満貫以上の点数計算）の出題盤面（手牌の提示と点数の回答）
 * 昇級試験盤面
 *
 * 測っているのは「手牌から翻数を数え、そのまま点数を導く」ところまで。
 * 5翻以上は符が点数に効かないので、符の積み上げは問わない。
 * 回答の選択肢は満貫以上（`manganPlus`）に固定する。
 *
 * 平和と並んで成立率が低い出題条件なので、生成予算を既定より大きく取る
 * （`EXAM_GENERATION_MAX_RETRIES` 参照）。
 */
export const ManganExamBoard = createScoreExamBoard({
  translationNamespace: "manganExamChallenge",
  generateOptions: EXAM_GENERATE_OPTIONS,
  scoreRange: "manganPlus",
  maxRetries: EXAM_GENERATION_MAX_RETRIES,
});
