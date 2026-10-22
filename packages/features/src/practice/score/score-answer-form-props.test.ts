import { HaiKind, generateValidScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { generateOrThrow } from "../../test/generate-or-throw";

import { scoreAnswerTargetOf } from "./score-answer-form-props";

describe("scoreAnswerTargetOf", () => {
  it("自風が東の出題は親として、翻数は正解から取る", () => {
    const question = generateOrThrow(() =>
      generateValidScoreQuestion({ includeChild: false }),
    );
    expect(question.jikaze).toBe(HaiKind.Ton);
    expect(scoreAnswerTargetOf(question)).toEqual({
      isOya: true,
      isTsumo: question.isTsumo,
      han: question.answer.han,
    });
  });

  it("自風が東以外の出題は子", () => {
    const question = generateOrThrow(() =>
      generateValidScoreQuestion({ includeParent: false }),
    );
    expect(question.jikaze).not.toBe(HaiKind.Ton);
    expect(scoreAnswerTargetOf(question).isOya).toBe(false);
  });
});
