import type { TenpaiScoreQuestion, UserAnswer } from "@mahjong-scoring/core";
import type { MachiCellAnswer } from "@mahjong-scoring/core";
import { cellKeyOf, listCellRefs, type MachiCellRef } from "./cell-ref";
import { sharedAnswerOfCells } from "./cell-runs";

/** 回答欄の列（ツモ / ロン）。欄は列ごとに 1 つ */
export const CELL_COLUMNS = ["tsumo", "ron"] as const;
export type CellColumn = (typeof CELL_COLUMNS)[number];

/**
 * 点数を当てはめる段階（`cells`）の画面に出す値
 * マス回答段階の表示
 */
export interface CellsPhaseView {
  /** まだ回答していないマスの数。0 になるまで「回答する」は押せない */
  readonly remaining: number;
  /**
   * 選択中のマスの列。選択中のマスは同じ列に限られる（ストアが保証する）ので
   * 先頭で決まる。何も選んでいなければ undefined
   */
  readonly selectedIsTsumo: boolean | undefined;
  /** マスを選んでいる（回答中）か。回答中は「回答する」を押させない */
  readonly isSelecting: boolean;
  /**
   * 選択中の回答済みマスの回答が 1 種類に定まるなら、その回答を欄に読み込む
   * （役なしは欄に入れるものが無いので読み込まない）。ストアが持つ回答の
   * 参照をそのまま返す — 欄は参照の変化で読み込み直すので、render のたびに
   * 作り直すと入力のたびに読み込みが走る
   */
  readonly prefill: UserAnswer | undefined;
}

/**
 * マス回答段階の画面に出す値を導く（web とアプリの盤面が共有する）
 * マス回答段階の導出
 */
export function resolveCellsPhaseView(
  question: Readonly<TenpaiScoreQuestion>,
  selectedCells: readonly MachiCellRef[],
  cellAnswers: Readonly<Record<string, MachiCellAnswer>>,
): CellsPhaseView {
  const remaining = listCellRefs(question).filter(
    (cell) => !(cellKeyOf(cell) in cellAnswers),
  ).length;
  const selectedIsTsumo = selectedCells[0]?.isTsumo;
  const sharedAnswer = sharedAnswerOfCells(selectedCells, cellAnswers);
  return {
    remaining,
    selectedIsTsumo,
    isSelecting: selectedIsTsumo !== undefined,
    prefill: sharedAnswer?.kind === "score" ? sharedAnswer.answer : undefined,
  };
}
