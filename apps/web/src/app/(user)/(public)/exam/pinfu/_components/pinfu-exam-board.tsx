"use client";

import { createScoreExamBoard } from "../../_lib/create-score-exam-board";
import {
  EXAM_GENERATE_OPTIONS,
  EXAM_GENERATION_MAX_RETRIES,
} from "../_lib/types";

/**
 * 昇級試験（平和の点数計算）の出題盤面（手牌の提示と点数の回答）
 * 昇級試験盤面
 *
 * 測っているのは「平和が成立していると見抜き、翻数を数え、符が役で決まる手の
 * 点数表を引く」ところまで。平和の成立自体が最初の1翻ぶんの判断にあたり、
 * 符はツモなら20符・ロンなら30符に決まる。
 * 回答の選択肢は満貫未満（`nonMangan`）に固定する。
 *
 * 平和は1回の試行あたりの成立率が低いため、生成予算を既定より大きく取る
 * （`EXAM_GENERATION_MAX_RETRIES` 参照）。
 */
export const PinfuExamBoard = createScoreExamBoard({
  translationNamespace: "pinfuExamChallenge",
  generateOptions: EXAM_GENERATE_OPTIONS,
  scoreRange: "nonMangan",
  maxRetries: EXAM_GENERATION_MAX_RETRIES,
});
