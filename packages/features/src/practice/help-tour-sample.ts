import {
  generateValidScoreQuestion,
  generateValidTenpaiScoreQuestion,
  isOya,
} from "@mahjong-scoring/core";
import type {
  JudgementResult,
  MachiCellAnswer,
  ScoreQuestion,
  TenpaiScoreQuestion,
} from "@mahjong-scoring/core";

import {
  cellKeyOf,
  listCellRefs,
  type MachiCellRef,
} from "./tenpai-score/cell-ref";
import {
  cellAnswerFormatters,
  correctCellAnswerOf,
  type CellAnswerFormatters,
  type FormatCellAnswerOptions,
} from "./tenpai-score/format-cell-answer";

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

/**
 * 聴牌形の見本の盤面（ヘルプツアー・プレビュー）でマスを描く整形関数
 * 聴牌形見本マス整形
 *
 * 見本は端末のルール設定を読まず、翻は範囲（`exactHan: false`）で、
 * ダブル役満の点数は出さずに描く。親子だけは出題から決める。web と
 * モバイルのヘルプ・プレビューが同じ見え方になるよう、ここで固定する。
 */
export function tenpaiHelpCellFormatters(
  question: TenpaiScoreQuestion,
  { t, noYakuLabel }: Pick<FormatCellAnswerOptions, "t" | "noYakuLabel">,
): CellAnswerFormatters {
  return cellAnswerFormatters({
    t,
    noYakuLabel,
    exactHan: false,
    allowDoubleYakuman: false,
    isOya: isOya(question.jikaze),
  });
}

/**
 * マスのスライドで見せる途中経過 — ツモ列は回答済み、ロン列は選択中
 * 聴牌形ヘルプ途中経過
 *
 * @param answers - {@link buildTenpaiHelpCells} の全マスの正解の回答
 */
export function tenpaiHelpProgress(
  question: TenpaiScoreQuestion,
  answers: Readonly<Record<string, MachiCellAnswer>>,
): {
  readonly tsumoAnswers: Readonly<Record<string, MachiCellAnswer>>;
  readonly ronCells: readonly MachiCellRef[];
} {
  const tsumoAnswers: Record<string, MachiCellAnswer> = {};
  const ronCells: MachiCellRef[] = [];
  for (const cell of listCellRefs(question)) {
    const key = cellKeyOf(cell);
    if (cell.isTsumo) tsumoAnswers[key] = answers[key];
    else ronCells.push(cell);
  }
  return { tsumoAnswers, ronCells };
}
