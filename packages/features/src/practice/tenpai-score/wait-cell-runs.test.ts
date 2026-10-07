import { describe, expect, it } from "vitest";
import type {
  MachiCellAnswer,
  TenpaiScoreQuestion,
} from "@mahjong-scoring/core";
import { generateValidTenpaiScoreQuestion } from "@mahjong-scoring/core";

import { cellKeyOf, type MachiCellRef } from "./cell-ref";
import { sharedAnswerOfCells } from "./cell-runs";
import { buildWaitCellRuns } from "./wait-cell-runs";

/** n 面待ち以上の出題。生成器は core の実物 */
function seedQuestion(minWaits = 2): TenpaiScoreQuestion {
  for (let i = 0; i < 200; i++) {
    const question = generateValidTenpaiScoreQuestion();
    if (question && question.waits.length >= minWaits) return question;
  }
  throw new Error(`${minWaits} 面待ち以上の問題を生成できなかった`);
}

/** 毎回別の参照を作る（中身が同じなら同じ回答として扱われることを見る） */
const answer = (han: number): MachiCellAnswer => ({
  kind: "score",
  answer: { han, fu: 30, score: 1000 * han, yakus: [] },
});

function tsumoCellsOf(question: TenpaiScoreQuestion): MachiCellRef[] {
  return question.waits.map((w) => ({ agariHai: w.agariHai, isTsumo: true }));
}

describe("buildWaitCellRuns", () => {
  it("縦に隣り合う選択中のマスは 1 つの塊になり、未回答なら回答を持たない", () => {
    const question = seedQuestion(2);
    const cells = tsumoCellsOf(question);
    const { runAt, absorbed, selectedKeys } = buildWaitCellRuns(
      question,
      {},
      cells,
    );

    const run = runAt.get(cellKeyOf(cells[0]));
    expect(run?.group).toBe("answering");
    expect(run?.cells.map(cellKeyOf)).toEqual(cells.map(cellKeyOf));
    expect(run?.answer).toBeUndefined();
    expect(runAt.size).toBe(1);
    expect([...absorbed]).toEqual(cells.slice(1).map(cellKeyOf));
    expect([...selectedKeys]).toEqual(cells.map(cellKeyOf));
  });

  it("1 マスだけの選択は塊にしない", () => {
    const question = seedQuestion(2);
    const [cell] = tsumoCellsOf(question);
    const { runAt, absorbed, selectedKeys } = buildWaitCellRuns(question, {}, [
      cell,
    ]);

    expect(runAt.size).toBe(0);
    expect(absorbed.size).toBe(0);
    expect(selectedKeys.has(cellKeyOf(cell))).toBe(true);
  });

  it("間を空けて選んだマスはつながらず、どちらも 1 マスなので塊にならない", () => {
    const question = seedQuestion(3);
    const cells = tsumoCellsOf(question);
    const { runAt } = buildWaitCellRuns(question, {}, [cells[0], cells[2]]);
    expect(runAt.size).toBe(0);
  });

  it("未選択で縦に隣り合う回答済みのマスは、回答の中身が同じなら塊になり先頭の回答をそのまま指す", () => {
    const question = seedQuestion(2);
    const cells = tsumoCellsOf(question);
    const cellAnswers = Object.fromEntries(
      cells.map((cell) => [cellKeyOf(cell), answer(1)]),
    );
    const { runAt } = buildWaitCellRuns(question, cellAnswers, []);

    const run = runAt.get(cellKeyOf(cells[0]));
    expect(run?.group).toMatch(/^answered:/);
    expect(run?.cells).toHaveLength(cells.length);
    expect(run?.answer).toBe(cellAnswers[cellKeyOf(cells[0])]);
  });

  it("未選択の回答済みでも回答が違えば塊にならない", () => {
    const question = seedQuestion(2);
    const cells = tsumoCellsOf(question);
    const cellAnswers = Object.fromEntries(
      cells.map((cell, i) => [cellKeyOf(cell), answer(i + 1)]),
    );
    expect(buildWaitCellRuns(question, cellAnswers, []).runAt.size).toBe(0);
  });

  it("未選択の未回答のマスは塊に入らず、同じ回答のマスを間で分ける", () => {
    const question = seedQuestion(3);
    const cells = tsumoCellsOf(question);
    const cellAnswers = {
      [cellKeyOf(cells[0])]: answer(1),
      [cellKeyOf(cells[2])]: answer(1),
    };
    expect(buildWaitCellRuns(question, cellAnswers, []).runAt.size).toBe(0);
  });

  it("選択中と未選択の回答済みは、回答が同じでも隣り合っても 1 つにならない", () => {
    const question = seedQuestion(2);
    const cells = tsumoCellsOf(question);
    const cellAnswers = Object.fromEntries(
      cells.map((cell) => [cellKeyOf(cell), answer(1)]),
    );
    const { runAt } = buildWaitCellRuns(question, cellAnswers, [cells[0]]);
    expect(runAt.has(cellKeyOf(cells[0]))).toBe(false);
  });

  it("選択中の塊は全マスが同じ回答ならその回答を持つ", () => {
    const question = seedQuestion(2);
    const cells = tsumoCellsOf(question);
    const cellAnswers = Object.fromEntries(
      cells.map((cell) => [cellKeyOf(cell), answer(2)]),
    );
    const run = buildWaitCellRuns(question, cellAnswers, cells).runAt.get(
      cellKeyOf(cells[0]),
    );
    expect(run?.group).toBe("answering");
    expect(run?.answer).toBe(cellAnswers[cellKeyOf(cells[0])]);
  });

  it("選択中の塊は回答が違えば回答を持たない", () => {
    const question = seedQuestion(2);
    const cells = tsumoCellsOf(question);
    const cellAnswers = Object.fromEntries(
      cells.map((cell, i) => [cellKeyOf(cell), answer(i + 1)]),
    );
    const run = buildWaitCellRuns(question, cellAnswers, cells).runAt.get(
      cellKeyOf(cells[0]),
    );
    expect(run?.answer).toBeUndefined();
  });

  it("選択中の塊に未回答のマスが混ざれば回答を持たない（sharedAnswerOfCells とは違い未回答を無視しない）", () => {
    const question = seedQuestion(2);
    const cells = tsumoCellsOf(question);
    // 先頭だけ回答済み・残りは未回答
    const cellAnswers = { [cellKeyOf(cells[0])]: answer(1) };
    const run = buildWaitCellRuns(question, cellAnswers, cells).runAt.get(
      cellKeyOf(cells[0]),
    );

    expect(run?.answer).toBeUndefined();
    // 回答欄の初期値は未回答を数えないので定まる
    expect(sharedAnswerOfCells(cells, cellAnswers)).toBe(
      cellAnswers[cellKeyOf(cells[0])],
    );
  });

  it("先頭が未回答で後ろが回答済みの選択中の塊も回答を持たない", () => {
    const question = seedQuestion(2);
    const cells = tsumoCellsOf(question);
    const cellAnswers = { [cellKeyOf(cells[1])]: answer(1) };
    const run = buildWaitCellRuns(question, cellAnswers, cells).runAt.get(
      cellKeyOf(cells[0]),
    );
    expect(run?.answer).toBeUndefined();
  });
});
