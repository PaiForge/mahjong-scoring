import { describe, expect, it } from "vitest";

import {
  buildTenpaiHelpCells,
  generateTenpaiHelpSample,
  HELP_TOUR_ALL_CORRECT,
} from "./help-tour-sample";
import { cellKeyOf, listCellRefs } from "./tenpai-score/cell-ref";
import { correctCellAnswerOf } from "./tenpai-score/format-cell-answer";

describe("buildTenpaiHelpCells", () => {
  it("待ちごとのツモ・ロンの全マスを正解の回答と全問正解の判定で埋める", () => {
    const question = generateTenpaiHelpSample();
    if (!question) throw new Error("サンプルを作れなかった");

    const { answers, results } = buildTenpaiHelpCells(question);

    const cells = listCellRefs(question);
    expect(Object.keys(answers)).toHaveLength(cells.length);
    expect(Object.keys(results)).toHaveLength(cells.length);
    for (const wait of question.waits) {
      expect(
        answers[cellKeyOf({ agariHai: wait.agariHai, isTsumo: true })],
      ).toEqual(correctCellAnswerOf(wait.tsumo));
      expect(
        answers[cellKeyOf({ agariHai: wait.agariHai, isTsumo: false })],
      ).toEqual(correctCellAnswerOf(wait.ron));
    }
    for (const cell of cells) {
      expect(results[cellKeyOf(cell)]).toBe(HELP_TOUR_ALL_CORRECT);
    }
  });
});
