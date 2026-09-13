import { describe, expect, it } from "vitest";
import type {
  MachiCellAnswer,
  MachiScoreQuestion,
  ScoreQuestion,
} from "@mahjong-scoring/core";
import { generateValidMachiScoreQuestion } from "@mahjong-scoring/core";

import { cellKeyOf } from "../../_hooks/use-machi-score-store";
import { groupAdjacentCells, indexRuns, resultCellKey } from "../cell-runs";

/** 3 面待ち以上の出題（飛び石の検証に要る）。生成器は core の実物 */
function seedQuestion(minWaits = 2): MachiScoreQuestion {
  for (let i = 0; i < 200; i++) {
    const question = generateValidMachiScoreQuestion();
    if (question && question.waits.length >= minWaits) return question;
  }
  throw new Error(`${minWaits} 面待ち以上の問題を生成できなかった`);
}

const ANSWER: MachiCellAnswer = {
  kind: "score",
  answer: { han: 1, fu: 30, score: 1000, yakus: [] },
};

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

describe("resultCellKey", () => {
  const question = seedQuestion(2);
  const base: ScoreQuestion = question.waits[0].tsumo;

  it("正解・内訳・回答がすべて同じなら同じキー", () => {
    expect(resultCellKey(base, ANSWER)).toBe(
      resultCellKey({ ...base }, { ...ANSWER }),
    );
  });

  it("点数が同じでも符の内訳が違えば別のキー", () => {
    const other: ScoreQuestion = {
      ...base,
      fuDetails: [...(base.fuDetails ?? []), { reason: "嵌張待ち", fu: 2 }],
    };
    expect(resultCellKey(base, ANSWER)).not.toBe(resultCellKey(other, ANSWER));
  });

  it("正解が同じでも自分の回答が違えば別のキー", () => {
    const other: MachiCellAnswer = {
      kind: "score",
      answer: { ...ANSWER.answer, han: 2 },
    };
    expect(resultCellKey(base, ANSWER)).not.toBe(resultCellKey(base, other));
  });

  it("無回答の開示は正解と内訳だけで決まる", () => {
    expect(resultCellKey(base, undefined)).toBe(
      resultCellKey({ ...base }, undefined),
    );
    expect(resultCellKey(base, undefined)).not.toBe(
      resultCellKey(base, ANSWER),
    );
  });

  it("役なしのマスは役なしどうしで同じキー", () => {
    expect(resultCellKey(undefined, { kind: "noYaku" })).toBe(
      resultCellKey(undefined, { kind: "noYaku" }),
    );
    expect(resultCellKey(undefined, { kind: "noYaku" })).not.toBe(
      resultCellKey(base, { kind: "noYaku" }),
    );
  });
});
