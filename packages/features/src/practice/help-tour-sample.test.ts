import { describe, expect, it } from "vitest";

import {
  answerFieldsOf,
  buildTenpaiHelpCells,
  generateTenpaiHelpSample,
  helpSampleAnswer,
  HELP_TOUR_ALL_CORRECT,
  tenpaiHelpCellFormatters,
  tenpaiHelpProgress,
} from "./help-tour-sample";
import { TENPAI_SCORE_DEMO_QUESTION } from "./tenpai-score/demo-question";
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

  it("翻数と符を問わない設定では、点数の回答から翻数・符を外す", () => {
    const question = generateTenpaiHelpSample();
    if (!question) throw new Error("サンプルを作れなかった");

    const { answers } = buildTenpaiHelpCells(question, { requireHanFu: false });

    for (const answer of Object.values(answers)) {
      if (answer.kind !== "score") continue;
      expect(answer.answer.han).toBeUndefined();
      expect(answer.answer.fu).toBeUndefined();
    }
    expect(Object.values(answers).some((a) => a.kind === "score")).toBe(true);
  });
});

describe("helpSampleAnswer", () => {
  const answer = { han: 3, fu: 40, score: 5200, yakus: [] };

  it("翻数と符も答える設定ではそのまま返す", () => {
    expect(helpSampleAnswer(answer, true)).toBe(answer);
  });

  it("翻数と符を問わない設定では翻数・符を外し、点数は残す", () => {
    expect(helpSampleAnswer(answer, false)).toEqual({
      han: undefined,
      fu: undefined,
      score: 5200,
      yakus: [],
    });
  });
});

describe("answerFieldsOf", () => {
  it("辞書の select に渡す答え方を返す", () => {
    expect(answerFieldsOf(true)).toEqual({ fields: "hanFu" });
    expect(answerFieldsOf(false)).toEqual({ fields: "scoreOnly" });
  });
});

describe("tenpaiHelpProgress", () => {
  it("ツモ列は正解の回答で埋め、ロン列は選択中のマスとして返す", () => {
    const question = generateTenpaiHelpSample();
    if (!question) throw new Error("サンプルを作れなかった");
    const { answers } = buildTenpaiHelpCells(question);

    const { tsumoAnswers, ronCells } = tenpaiHelpProgress(question, answers);

    const cells = listCellRefs(question);
    const tsumoCells = cells.filter((cell) => cell.isTsumo);
    expect(Object.keys(tsumoAnswers)).toHaveLength(tsumoCells.length);
    for (const cell of tsumoCells) {
      expect(tsumoAnswers[cellKeyOf(cell)]).toBe(answers[cellKeyOf(cell)]);
    }
    expect(ronCells).toEqual(cells.filter((cell) => !cell.isTsumo));
  });
});

describe("tenpaiHelpCellFormatters", () => {
  /** 辞書の代わり */
  const t = (key: string) =>
    ({
      "form.options.hanSuffix": "翻",
      "form.options.fuSuffix": "符",
      "form.options.mangan": "満貫",
      "result.pointSuffix": "点",
    })[key] ?? key;

  it("翻は範囲（満貫は区分名）で描き、役なしは渡した文言にする", () => {
    const { formatAnswer } = tenpaiHelpCellFormatters(
      TENPAI_SCORE_DEMO_QUESTION,
      { t, noYakuLabel: "役なし" },
    );

    expect(
      formatAnswer(
        {
          kind: "score",
          answer: { han: 5, fu: undefined, score: 8000, yakus: [] },
        },
        false,
      ),
    ).toBe("満貫 8000点");
    expect(formatAnswer({ kind: "noYaku" }, false)).toBe("役なし");
  });
});
