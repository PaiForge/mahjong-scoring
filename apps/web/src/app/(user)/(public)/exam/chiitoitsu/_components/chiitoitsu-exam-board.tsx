"use client";

import { EXAM_BOARD_CONFIG } from "@mahjong-scoring/features/exam/chiitoitsu/types";
import { createScoreExamBoard } from "../../_lib/create-score-exam-board";

/**
 * 昇級試験（七対子の点数計算）の出題盤面（手牌の提示と点数の回答）
 * 昇級試験盤面
 *
 * 測っているのは「七対子が成立していると見抜き、翻数を数え、25符の点数表を
 * 引く」ところまで。七対子の成立自体が最初の1翻ぶんの判断にあたり、符は雀頭を
 * 持たないため常に25符に決まる。
 * 回答の選択肢は満貫未満（`nonMangan`）に固定する。
 */
export const ChiitoitsuExamBoard = createScoreExamBoard(EXAM_BOARD_CONFIG);
