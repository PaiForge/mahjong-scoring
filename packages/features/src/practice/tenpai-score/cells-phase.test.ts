import { describe, expect, it } from "vitest";
import { machiCellKey, type MachiCellAnswer } from "@mahjong-scoring/core";
import { listCellRefs } from "./cell-ref";
import { CELL_COLUMNS, resolveCellsPhaseView } from "./cells-phase";
import { TENPAI_SCORE_DEMO_QUESTION } from "./demo-question";

const question = TENPAI_SCORE_DEMO_QUESTION;
const [first, second] = question.waits;
const score = (han: number): Extract<MachiCellAnswer, { kind: "score" }> => ({
  kind: "score",
  answer: { han, fu: 30, score: 1000, yakus: [] },
});

describe("resolveCellsPhaseView", () => {
  it("何も選ばず何も答えていなければ、全マスが残りで回答中ではない", () => {
    const view = resolveCellsPhaseView(question, [], {});
    expect(view.remaining).toBe(question.waits.length * 2);
    expect(view.selectedIsTsumo).toBeUndefined();
    expect(view.isSelecting).toBe(false);
    expect(view.prefill).toBeUndefined();
  });

  it("選択中の列は先頭のマスで決まり、回答済みは残りから減る", () => {
    const answers = { [machiCellKey(first.agariHai, true)]: score(1) };
    const view = resolveCellsPhaseView(
      question,
      [{ agariHai: second.agariHai, isTsumo: false }],
      answers,
    );
    expect(view.remaining).toBe(question.waits.length * 2 - 1);
    expect(view.selectedIsTsumo).toBe(false);
    expect(view.isSelecting).toBe(true);
  });

  it("選択中の回答済みマスの回答が 1 種類なら欄に読み込み、割れたら読み込まない", () => {
    const same = score(2);
    const answers = {
      [machiCellKey(first.agariHai, true)]: same,
      [machiCellKey(second.agariHai, true)]: same,
    };
    const cells = [
      { agariHai: first.agariHai, isTsumo: true },
      { agariHai: second.agariHai, isTsumo: true },
    ];
    expect(resolveCellsPhaseView(question, cells, answers).prefill).toBe(
      same.answer,
    );
    expect(
      resolveCellsPhaseView(question, cells, {
        ...answers,
        [machiCellKey(second.agariHai, true)]: score(3),
      }).prefill,
    ).toBeUndefined();
    // 役なしは欄に入れるものが無い
    expect(
      resolveCellsPhaseView(question, [cells[0]], {
        [machiCellKey(first.agariHai, true)]: { kind: "noYaku" },
      }).prefill,
    ).toBeUndefined();
  });
});

describe("CELL_COLUMNS", () => {
  it("回答欄の列は、マスの並びと同じくツモ列・ロン列の順に 1 つずつ", () => {
    const columnsOfCells = [
      ...new Set(listCellRefs(question).map((cell) => cell.isTsumo)),
    ];
    expect(CELL_COLUMNS.map((column) => column === "tsumo")).toEqual(
      columnsOfCells,
    );
    expect(new Set(CELL_COLUMNS).size).toBe(CELL_COLUMNS.length);
    expect(CELL_COLUMNS.every((column) => column.length > 0)).toBe(true);
  });
});
