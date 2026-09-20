import type {
  MachiCellAnswer,
  MachiScoreQuestion,
} from "@mahjong-scoring/core";
import { cellKeyOf, type MachiCellRef } from "../_hooks/use-machi-score-store";

/**
 * 回答の同一性のキー。同じ回答のマスを 1 つの塊にするために使う
 * 回答キー
 *
 * 表示の文字ではなく中身で比べる — 役を答える設定では翻・符・点数が同じでも
 * 役の組が違う回答があり、それを 1 つにすると当てはめ直しで片方の役が
 * 消える。
 */
export function answerKey(answer: MachiCellAnswer): string {
  if (answer.kind === "noYaku") return "noYaku";
  const { han, fu, score, scoreFromKo, scoreFromOya, yakus } = answer.answer;
  return JSON.stringify([
    han,
    fu,
    score,
    scoreFromKo,
    scoreFromOya,
    [...yakus].sort(),
  ]);
}

/**
 * 選択中のマスが持つ回答が 1 種類に定まるならそれを返す
 * 選択の共通回答
 *
 * 未回答のマスは数えない — 「回答済みの塊を押して未回答のマスと一緒に
 * 選んだ」状態で、塊の回答をそのまま未回答のマスにも使えるようにする
 * ため。回答済みのマスが無い、または回答が 2 種類以上あるなら undefined。
 * 回答フォームがこれを初期値に読み込み、同じ点数の待ちを後からまとめ直す
 * ときや、まとめて答えた符だけ直すときに入れ直しを不要にする。
 */
export function sharedAnswerOfCells(
  cells: readonly MachiCellRef[],
  cellAnswers: Readonly<Record<string, MachiCellAnswer>>,
): MachiCellAnswer | undefined {
  let shared: MachiCellAnswer | undefined;
  for (const cell of cells) {
    const answer = cellAnswers[cellKeyOf(cell)];
    if (!answer) continue;
    if (shared === undefined) {
      shared = answer;
    } else if (answerKey(answer) !== answerKey(shared)) {
      return undefined;
    }
  }
  return shared;
}

/**
 * 縦に隣り合う同じグループのマスの塊
 * マスの塊
 */
export interface CellRun<G extends string = string> {
  readonly group: G;
  /** 待ちの並び順。先頭のマスが塊の位置（`rowSpan` を持つ td）になる */
  readonly cells: readonly MachiCellRef[];
}

/**
 * 列（ツモ / ロン）ごとに、縦に隣り合う同じグループのマスを塊にまとめる
 * 塊分け
 *
 * `groupOf` が undefined を返したマスは塊に入らない。グループが違うマスを
 * 間に挟むと（3-6-9 で 3 と 9 だけ同じなど）つながらず、それぞれが別の塊に
 * なる — 表の `rowSpan` で 1 枚にできるのは縦に続く行だけで、飛び石を
 * 1 つに見せる手立てが表には無い。
 *
 * 塊は 1 マスだけのものも返す（`cells.length === 1`）。描く側は先頭の
 * マスで塊を引き、先頭以外のマスは td を描かない（`rowSpan` が行を
 * またぐ）。
 */
export function groupAdjacentCells<G extends string>(
  question: Readonly<MachiScoreQuestion>,
  groupOf: (cell: MachiCellRef) => G | undefined,
): readonly CellRun<G>[] {
  const runs: CellRun<G>[] = [];
  for (const isTsumo of [true, false]) {
    let run: MachiCellRef[] = [];
    let runGroup: G | undefined;
    const flush = () => {
      if (runGroup !== undefined && run.length > 0) {
        runs.push({ group: runGroup, cells: run });
      }
      run = [];
      runGroup = undefined;
    };
    for (const wait of question.waits) {
      const cell = { agariHai: wait.agariHai, isTsumo };
      const group = groupOf(cell);
      if (group === undefined || group !== runGroup) flush();
      if (group !== undefined) {
        run.push(cell);
        runGroup = group;
      }
    }
    flush();
  }
  return runs;
}

/**
 * 塊を先頭のマスのキーで引く表と、先頭以外のマス（td を描かない）の集合
 * 塊の索引
 */
export function indexRuns<G extends string>(
  runs: readonly CellRun<G>[],
): {
  readonly runAt: ReadonlyMap<string, CellRun<G>>;
  readonly absorbed: ReadonlySet<string>;
} {
  const runAt = new Map<string, CellRun<G>>();
  const absorbed = new Set<string>();
  for (const run of runs) {
    runAt.set(cellKeyOf(run.cells[0]), run);
    for (const cell of run.cells.slice(1)) absorbed.add(cellKeyOf(cell));
  }
  return { runAt, absorbed };
}
