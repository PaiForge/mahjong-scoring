import type { HaiKindId, TenpaiScoreQuestion } from "@mahjong-scoring/core";
import { machiCellKey } from "@mahjong-scoring/core";

/**
 * 解答の段階
 * 解答フェーズ
 *
 * - `machi`: 待ち牌を選ぶ。回答すると正誤を見せたまま同じ段階に留まり、
 *   「点数計算へ進む」で次へ
 * - `cells`: 待ち × ツモ/ロンのマスに点数を当てはめる
 * - `result`: 答え合わせ
 */
export type TenpaiScorePhase = "machi" | "cells" | "result";

/**
 * マス（待ち牌 1 つ × 和了方法 1 つ）の参照
 * マス参照
 */
export interface MachiCellRef {
  readonly agariHai: HaiKindId;
  readonly isTsumo: boolean;
}

/** マス参照からキーを引く（core の `machiCellKey` と同じ） */
export function cellKeyOf(cell: MachiCellRef): string {
  return machiCellKey(cell.agariHai, cell.isTsumo);
}

/**
 * 出題のすべてのマス（ツモ列を待ちの順に、続けてロン列を待ちの順に）
 * マスの並び
 *
 * 回答の自動送り（`assignAnswer`）と答え合わせのタブがこの順に並ぶ。
 * 列を先にするのは、マスを選ぶ単位も回答欄も列（ツモ / ロン）で
 * 分かれているため。答え合わせでも隣り合うタブの違いが待ちだけになり、
 * ツモならツモ同士で点数を見比べられる — 行を先にすると、隣のタブは
 * 待ちと和了方法が同時に変わる。塊分け（`groupAdjacentCells`）も
 * 同じ順で列ごとに見る。
 */
export function listCellRefs(
  question: Readonly<TenpaiScoreQuestion>,
): readonly MachiCellRef[] {
  return [true, false].flatMap((isTsumo) =>
    question.waits.map((wait) => ({ agariHai: wait.agariHai, isTsumo })),
  );
}
