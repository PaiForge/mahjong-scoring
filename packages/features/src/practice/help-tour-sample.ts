import {
  generateValidScoreQuestion,
  generateValidTenpaiScoreQuestion,
} from "@mahjong-scoring/core";
import type {
  JudgementResult,
  MachiCellAnswer,
  ScoreQuestion,
  TenpaiScoreQuestion,
} from "@mahjong-scoring/core";

import { cellKeyOf, listCellRefs } from "./tenpai-score/cell-ref";
import { correctCellAnswerOf } from "./tenpai-score/format-cell-answer";

/**
 * ヘルプツアーの結果スライドで見せる「全問正解」の判定
 * ヘルプツアーの正解判定
 */
export const HELP_TOUR_ALL_CORRECT: JudgementResult = {
  isCorrect: true,
  isHanCorrect: true,
  isFuCorrect: true,
  isScoreCorrect: true,
  isYakuCorrect: true,
};

/**
 * 和了形の点数計算のヘルプで見せるサンプル。副露・七対子なしの分かりやすい手
 * 和了形ヘルプサンプル生成
 */
export function generateAgariHelpSample(): ScoreQuestion | undefined {
  return generateValidScoreQuestion({
    includeFuro: false,
    includeChiitoi: false,
  });
}

/**
 * 聴牌形の点数計算のヘルプで見せるサンプル。副露なしの分かりやすい手
 * 聴牌形ヘルプサンプル生成
 */
export function generateTenpaiHelpSample(): TenpaiScoreQuestion | undefined {
  return generateValidTenpaiScoreQuestion({ includeFuro: false });
}

/**
 * 聴牌形のサンプルの全マスを正解で埋めた回答と、その判定
 * 聴牌形ヘルプ正解マス生成
 */
export function buildTenpaiHelpCells(question: TenpaiScoreQuestion): {
  readonly answers: Readonly<Record<string, MachiCellAnswer>>;
  readonly results: Readonly<Record<string, JudgementResult>>;
} {
  const answers: Record<string, MachiCellAnswer> = {};
  const results: Record<string, JudgementResult> = {};
  for (const wait of question.waits) {
    answers[cellKeyOf({ agariHai: wait.agariHai, isTsumo: true })] =
      correctCellAnswerOf(wait.tsumo);
    answers[cellKeyOf({ agariHai: wait.agariHai, isTsumo: false })] =
      correctCellAnswerOf(wait.ron);
  }
  for (const cell of listCellRefs(question)) {
    results[cellKeyOf(cell)] = HELP_TOUR_ALL_CORRECT;
  }
  return { answers, results };
}
