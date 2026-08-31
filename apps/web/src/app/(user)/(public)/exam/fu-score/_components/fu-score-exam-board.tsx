"use client";

import { createScoreExamBoard } from "../../_lib/create-score-exam-board";
import { EXAM_GENERATE_OPTIONS } from "../_lib/types";

/**
 * 昇級試験（30〜50符の点数計算）の出題盤面（手牌の提示と点数の回答）
 * 昇級試験盤面
 *
 * 測っているのは「手牌から符を積み上げ、翻数を数え、点数表を引く」までの通し。
 * この級では符が役で固定されないため、点数系の試験のなかで唯一、符の計算まで
 * 受験者が行う。回答の選択肢は満貫未満（`nonMangan`）に固定する。
 */
export const FuScoreExamBoard = createScoreExamBoard({
  translationNamespace: "fuScoreExamChallenge",
  generateOptions: EXAM_GENERATE_OPTIONS,
  scoreRange: "nonMangan",
});
