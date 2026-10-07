import type {
  MachiCellAnswer,
  TenpaiScoreQuestion,
} from "@mahjong-scoring/core";
import { cellKeyOf, type MachiCellRef } from "./cell-ref";
import {
  answerKey,
  groupAdjacentCells,
  indexRuns,
  type CellRun,
} from "./cell-runs";

/**
 * 待ちマス表の塊のグループ
 * 塊のグループ
 *
 * - `answering`: 選択中のマス。見た目は 1 枚だが行ごとに押せて、押した行
 *   だけ選択から外れる
 * - `answered:<回答キー>`: 未選択で回答が同じマス。1 つの面で、押すと
 *   塊ごと選択に入る
 */
export type WaitCellRunGroup = "answering" | `answered:${string}`;

/**
 * 待ちマス表で 1 枚に描く塊（2 マス以上）
 * 待ちマスの塊
 */
export interface WaitCellRun extends CellRun<WaitCellRunGroup> {
  /**
   * 塊に出す回答。全マスが同じ回答を持つときだけ定まり、先頭のマスの回答を
   * そのまま指す（作り直さない）。undefined なら「まとめて回答中」と出す
   */
  readonly answer: MachiCellAnswer | undefined;
}

/**
 * 待ちマス表の描画に要る塊の索引
 * 待ちマスの塊の索引
 */
export interface WaitCellRuns {
  /** 選択中のマスのキー（`cellKeyOf`） */
  readonly selectedKeys: ReadonlySet<string>;
  /** 塊を先頭のマスのキーで引く表 */
  readonly runAt: ReadonlyMap<string, WaitCellRun>;
  /** 塊の先頭以外のマス。描かない（先頭の面が行をまたぐ） */
  readonly absorbed: ReadonlySet<string>;
}

/**
 * 塊の全マスが同じ回答を持つならその回答（先頭のマスの回答）を返す
 *
 * `sharedAnswerOfCells` とは契約が違う — あちらは未回答のマスを数えず
 * 回答欄の初期値を決めるが、塊の文字は未回答のマスが 1 つでも混ざれば
 * 「まとめて回答中」にする（その回答はまだ全マスには入っていない）。
 */
function uniformAnswerOfRun(
  run: CellRun,
  cellAnswers: Readonly<Record<string, MachiCellAnswer>>,
): MachiCellAnswer | undefined {
  const answer = cellAnswers[cellKeyOf(run.cells[0])];
  if (!answer) return undefined;
  const key = answerKey(answer);
  const allSame = run.cells.every((cell) => {
    const other = cellAnswers[cellKeyOf(cell)];
    return other !== undefined && answerKey(other) === key;
  });
  return allSame ? answer : undefined;
}

/**
 * 待ちマス表の塊を組む
 * 待ちマスの塊分け
 *
 * 縦に隣り合うマスが塊になる条件は「どちらも選択中」か「どちらも未選択の
 * 回答済みで回答が同じ」。未選択の未回答のマスは塊に入らない。1 マスだけの
 * ものは塊として扱わず、描く側が単体のマスとして描く。回答の同一性は
 * 表示の文字ではなく `answerKey` で比べる（別々に答えて同じになったものも
 * 1 つにする）。
 *
 * 文言（「まとめて回答中」）と回答の文字への整形、面の大きさ（web の
 * `rowSpan`・RN の高さ）は描く側が持つ。
 */
export function buildWaitCellRuns(
  question: Readonly<TenpaiScoreQuestion>,
  cellAnswers: Readonly<Record<string, MachiCellAnswer>>,
  selectedCells: readonly MachiCellRef[],
): WaitCellRuns {
  const selectedKeys = new Set(selectedCells.map(cellKeyOf));
  const runs = groupAdjacentCells<WaitCellRunGroup>(question, (cell) => {
    const key = cellKeyOf(cell);
    const answer = cellAnswers[key];
    return selectedKeys.has(key)
      ? "answering"
      : answer
        ? `answered:${answerKey(answer)}`
        : undefined;
  })
    .filter((run) => run.cells.length >= 2)
    .map((run): WaitCellRun => ({
      ...run,
      answer: uniformAnswerOfRun(run, cellAnswers),
    }));
  const { runAt, absorbed } = indexRuns(runs);
  return { selectedKeys, runAt, absorbed };
}
