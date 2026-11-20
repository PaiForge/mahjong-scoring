import { describe, expect, it } from "vitest";
import type { ScoreTableQuestion } from "@mahjong-scoring/core";

import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@mahjong-scoring/features/practice-menu-types";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";

import { RESULT_STORAGE_KEY, toQuestionResult } from "./types";

const question: ScoreTableQuestion = {
  id: "q-1",
  isOya: true,
  isTsumo: false,
  han: 3,
  fu: 30,
  correctAnswer: { type: "ron", score: 5800 },
};

describe("toQuestionResult", () => {
  it("正解した回答は出題の条件と回答を写して正解になる", () => {
    const userAnswer = { type: "ron", score: 5800 } as const;
    expect(toQuestionResult(question, userAnswer)).toEqual({
      isOya: true,
      isTsumo: false,
      han: 3,
      fu: 30,
      correctAnswer: question.correctAnswer,
      userAnswer,
      outcome: AnswerOutcome.Correct,
    });
  });

  it("点数が違う回答は不正解になる", () => {
    const result = toQuestionResult(question, { type: "ron", score: 3900 });
    expect(result.outcome).toBe(AnswerOutcome.Incorrect);
    expect(result.userAnswer).toEqual({ type: "ron", score: 3900 });
  });

  it("時間切れで回答が無ければ時間切れになる", () => {
    const result = toQuestionResult(question, undefined);
    expect(result.outcome).toBe(AnswerOutcome.TimeUp);
    expect(result.userAnswer).toBeUndefined();
  });

  it("手牌を持たない出題なので、手牌のスナップショットも役満の倍率も付かない", () => {
    const result = toQuestionResult(question, undefined);
    expect(result).not.toHaveProperty("question");
    expect(result).not.toHaveProperty("yakumanMultiplier");
  });
});

describe("RESULT_STORAGE_KEY", () => {
  it("点数表早引きの練習の保存キーになる", () => {
    expect(RESULT_STORAGE_KEY).toBe(
      resultStorageKeyFor(PRACTICE_SLUG.scoreTable),
    );
  });
});
