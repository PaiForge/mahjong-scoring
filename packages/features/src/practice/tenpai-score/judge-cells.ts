import type {
  JudgementResult,
  MachiCellAnswer,
  MachiCellJudgementMode,
  TenpaiScoreQuestion,
} from "@mahjong-scoring/core";
import { judgeMachiCellAnswer, machiCellKey } from "@mahjong-scoring/core";

/**
 * 全マスの答え合わせ
 * 全マス判定
 */
export interface CellsJudgement {
  /** マスごとの判定（キーは `machiCellKey`） */
  readonly results: Readonly<Record<string, JudgementResult>>;
  /** すべてのマスが正解か */
  readonly allCorrect: boolean;
}

/**
 * 待ち × ツモ/ロン の全マスを採点する
 * 全マス採点
 *
 * 未回答のマスは答えていないので不正解扱い（画面は全マス回答まで送信させない
 * ため、通常ここには来ない）。
 *
 * @param question - 出題
 * @param cellAnswers - マスごとの回答（キーは `machiCellKey`）
 * @param mode - 判定モード（役・翻符・5翻以上の答え方・満貫以上の符・ダブル役満）
 */
export function judgeAllCells(
  question: TenpaiScoreQuestion,
  cellAnswers: Readonly<Record<string, MachiCellAnswer>>,
  mode: MachiCellJudgementMode,
): CellsJudgement {
  const results: Record<string, JudgementResult> = {};
  for (const wait of question.waits) {
    for (const isTsumo of [true, false]) {
      const key = machiCellKey(wait.agariHai, isTsumo);
      const answer = cellAnswers[key];
      results[key] = answer
        ? judgeMachiCellAnswer(isTsumo ? wait.tsumo : wait.ron, answer, mode)
        : judgeMachiCellAnswer(wait.tsumo, { kind: "noYaku" }, mode);
    }
  }
  return {
    results,
    allCorrect: Object.values(results).every((result) => result.isCorrect),
  };
}
