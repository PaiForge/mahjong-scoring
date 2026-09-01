"use client";

import { createScoreExamBoard } from "../../_lib/create-score-exam-board";
import { EXAM_GENERATE_OPTIONS } from "../_lib/types";

/**
 * 昇段試験（あらゆる手の点数計算）の出題盤面（手牌の提示と点数の回答）
 * 昇段試験盤面
 *
 * 測っているのは「どんな手が来ても点数が出せる」こと。1級までの試験は符か
 * 点数帯のどちらかを絞って主題を1つに保っていたが、この試験は絞らない —
 * 平和の20符も七対子の25符も、符を積み上げる面子手も、翻数だけで決まる
 * 満貫以上も、区別なく続けて出る。
 *
 * 回答の選択肢もその親子・ツモロンで取りうる全点数に開く（`"all"`）。点数帯に
 * 固定すると「満貫未満だ」と教えてしまい、点数表のどこを引くかの判断が
 * 出題の側に漏れる。
 */
export const ScoreExamBoard = createScoreExamBoard({
  translationNamespace: "scoreExamChallenge",
  generateOptions: EXAM_GENERATE_OPTIONS,
  scoreRange: "all",
});
