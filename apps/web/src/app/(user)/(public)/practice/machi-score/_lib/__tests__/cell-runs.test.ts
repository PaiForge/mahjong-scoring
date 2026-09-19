import { describe, expect, it } from "vitest";
import type {
  MachiCellAnswer,
  MachiScoreQuestion,
} from "@mahjong-scoring/core";
import { generateValidMachiScoreQuestion } from "@mahjong-scoring/core";

import { cellKeyOf } from "../../_hooks/use-machi-score-store";
import {
  groupAdjacentCells,
  indexRuns,
  sharedAnswerOfCells,
} from "../cell-runs";

/** 3 面待ち以上の出題（飛び石の検証に要る）。生成器は core の実物 */
function seedQuestion(minWaits = 2): MachiScoreQuestion {
  for (let i = 0; i < 200; i++) {
    const question = generateValidMachiScoreQuestion();
    if (question && question.waits.length >= minWaits) return question;
  }
  throw new Error(`${minWaits} 面待ち以上の問題を生成できなかった`);
}

describe("groupAdjacentCells", () => {
  it("縦に隣り合う同じグループのマスを列ごとに 1 つの塊にし、1 マスの塊も返す", () => {
    const question = seedQuestion(2);
    // ツモ列は全部同じ、ロン列は全部別
    const runs = groupAdjacentCells(question, (cell) =>
      cell.isTsumo ? "same" : `ron:${cell.agariHai}`,
    );

    const tsumoRuns = runs.filter((run) => run.cells[0].isTsumo);
    expect(tsumoRuns).toHaveLength(1);
    expect(tsumoRuns[0].cells.map((c) => c.agariHai)).toEqual(
      question.waits.map((w) => w.agariHai),
    );
    const ronRuns = runs.filter((run) => !run.cells[0].isTsumo);
    expect(ronRuns).toHaveLength(question.waits.length);
    expect(ronRuns.every((run) => run.cells.length === 1)).toBe(true);
  });

  it("間に別のグループを挟むと飛び石はつながらない", () => {
    const question = seedQuestion(3);
    const [first, middle] = question.waits;
    const runs = groupAdjacentCells(question, (cell) =>
      cell.agariHai === middle.agariHai ? "other" : "same",
    ).filter((run) => run.cells[0].isTsumo);

    expect(runs.map((run) => run.cells.length)).toEqual([
      1,
      1,
      question.waits.length - 2,
    ]);
    expect(runs[0].cells[0].agariHai).toBe(first.agariHai);
  });

  it("グループが undefined のマスは塊に入らない", () => {
    const question = seedQuestion(2);
    const runs = groupAdjacentCells(question, (cell) =>
      cell.isTsumo ? "same" : undefined,
    );
    expect(runs.every((run) => run.cells[0].isTsumo)).toBe(true);
  });

  it("indexRuns は塊を先頭のマスで引き、先頭以外を absorbed に入れる", () => {
    const question = seedQuestion(2);
    const runs = groupAdjacentCells(question, () => "same");
    const { runAt, absorbed } = indexRuns(runs);

    const tsumoHead = { agariHai: question.waits[0].agariHai, isTsumo: true };
    expect(runAt.get(cellKeyOf(tsumoHead))?.cells).toHaveLength(
      question.waits.length,
    );
    expect(absorbed.size).toBe((question.waits.length - 1) * 2);
    expect(absorbed.has(cellKeyOf(tsumoHead))).toBe(false);
  });
});

describe("sharedAnswerOfCells", () => {
  const answer = (han: number): MachiCellAnswer => ({
    kind: "score",
    answer: { han, fu: 30, score: 1000 * han, yakus: [] },
  });

  it("未回答のマスは数えず、回答済みのマスの回答が 1 種類ならそれを返す", () => {
    const question = seedQuestion(3);
    const [a, b, c] = question.waits;
    const cells = [a, b, c].map((w) => ({
      agariHai: w.agariHai,
      isTsumo: true,
    }));
    const shared = answer(2);
    const cellAnswers = {
      [cellKeyOf(cells[0])]: shared,
      [cellKeyOf(cells[1])]: answer(2),
    };
    // c は未回答のまま選択に入っている（塊の回答を c にも使える）
    expect(sharedAnswerOfCells(cells, cellAnswers)).toBe(shared);
  });

  it("回答が 2 種類以上あれば undefined", () => {
    const question = seedQuestion(2);
    const [a, b] = question.waits;
    const cells = [a, b].map((w) => ({ agariHai: w.agariHai, isTsumo: false }));
    const cellAnswers = {
      [cellKeyOf(cells[0])]: answer(2),
      [cellKeyOf(cells[1])]: answer(3),
    };
    expect(sharedAnswerOfCells(cells, cellAnswers)).toBeUndefined();
  });

  it("回答済みのマスが無ければ undefined", () => {
    const question = seedQuestion(2);
    const cells = question.waits.map((w) => ({
      agariHai: w.agariHai,
      isTsumo: true,
    }));
    expect(sharedAnswerOfCells(cells, {})).toBeUndefined();
  });
});
