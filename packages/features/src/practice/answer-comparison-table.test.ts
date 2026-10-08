import { describe, expect, it } from "vitest";

import { AnswerOutcome } from "../results/result-schemas";
import { buildAnswerComparisonTable } from "./answer-comparison-table";

const t = (key: string) => `<${key}>`;
const difference = { correct: 3, user: 4, format: (v: number) => `${v}翻` };

function build(
  outcome: AnswerOutcome | undefined,
  options: { difference?: typeof difference; showTitle?: boolean } = {},
) {
  return buildAnswerComparisonTable({
    tResult: t,
    tCommon: t,
    correct: "3翻",
    user: "4翻",
    outcome,
    difference: options.difference,
    showTitle: options.showTitle ?? true,
  });
}

describe("buildAnswerComparisonTable", () => {
  it("正解と回答を並べ、正誤の色は回答値だけに乗せる", () => {
    expect(build(AnswerOutcome.Incorrect).rows).toEqual([
      { label: "<correctAnswer>", value: "3翻" },
      { label: "<yourAnswer>", value: "4翻", tone: "incorrect" },
    ]);
    expect(build(AnswerOutcome.Correct).rows[1]?.tone).toBe("correct");
  });

  it("無回答の開示は本文色のまま", () => {
    expect(build(undefined).rows[1]?.tone).toBeUndefined();
  });

  it("時間切れは回答欄に時間切れを出し、過不足の行を付けない", () => {
    const table = build(AnswerOutcome.TimeUp, { difference });
    expect(table.rows[1]).toEqual({
      label: "<yourAnswer>",
      value: "<timeUpAnswer>",
      tone: undefined,
    });
    expect(table.total).toBeUndefined();
  });

  it("過不足を渡すと最後に過不足の行が付く", () => {
    expect(build(AnswerOutcome.Incorrect, { difference }).total).toEqual({
      label: "<difference>",
      value: "+1翻",
    });
    expect(build(AnswerOutcome.Incorrect).total).toBeUndefined();
  });

  it("見出しは出さない指定ができる", () => {
    expect(build(AnswerOutcome.Correct).title).toBe("<answerCheck>");
    expect(build(AnswerOutcome.Correct, { showTitle: false }).title).toBe(
      undefined,
    );
  });
});
