import { describe, expect, it } from "vitest";

import { AnswerOutcome, toNumericAnswerOutcome } from "./result-schemas";

describe("toNumericAnswerOutcome", () => {
  it("正解と同じ値なら Correct、違えば Incorrect", () => {
    expect(toNumericAnswerOutcome(30, 30)).toBe(AnswerOutcome.Correct);
    expect(toNumericAnswerOutcome(40, 30)).toBe(AnswerOutcome.Incorrect);
  });

  it("回答が無ければ比べずに TimeUp", () => {
    expect(toNumericAnswerOutcome(undefined, 30)).toBe(AnswerOutcome.TimeUp);
  });

  it("0 の回答は「回答なし」と取り違えない", () => {
    expect(toNumericAnswerOutcome(0, 0)).toBe(AnswerOutcome.Correct);
    expect(toNumericAnswerOutcome(0, 2)).toBe(AnswerOutcome.Incorrect);
  });
});
