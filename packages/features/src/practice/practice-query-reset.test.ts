import { describe, expect, it } from "vitest";

import { buildPracticeQueryReset } from "./practice-query-reset";

describe("buildPracticeQueryReset", () => {
  it("条件をマージし、成績・問題・回答の状態を戻して連番を進める", () => {
    const state = { options: { a: 1, b: 2 }, questionSeq: 4 };
    const initialAnswering = { isAnswered: false, userAnswer: undefined };

    expect(
      buildPracticeQueryReset(state, "?x=1", { b: 3 }, initialAnswering),
    ).toEqual({
      options: { a: 1, b: 3 },
      appliedQuery: "?x=1",
      stats: { total: 0, correct: 0 },
      currentQuestion: undefined,
      isAnswered: false,
      userAnswer: undefined,
      generationFailed: false,
      questionSeq: 5,
    });
  });
});
