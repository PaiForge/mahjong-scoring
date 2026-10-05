import { describe, expect, it } from "vitest";
import type { ScoreTableQuestion } from "@mahjong-scoring/core";

import {
  generateNextScoreTableQuestion,
  isSameDisplayedQuestion,
} from "./next-question";

function question(han: number, id = `q-${han}`): ScoreTableQuestion {
  return {
    id,
    isOya: false,
    isTsumo: false,
    han,
    fu: 30,
    correctAnswer: { type: "ron", score: 1000 },
  };
}

function queue(hans: readonly number[]): () => ScoreTableQuestion {
  let i = 0;
  return () => question(hans[Math.min(i++, hans.length - 1)], `q-${i}`);
}

describe("isSameDisplayedQuestion", () => {
  it("id が違っても表示が同じなら同一とみなす", () => {
    expect(isSameDisplayedQuestion(question(1, "a"), question(1, "b"))).toBe(
      true,
    );
  });

  it("翻が違えば別の問題", () => {
    expect(isSameDisplayedQuestion(question(1), question(2))).toBe(false);
  });
});

describe("generateNextScoreTableQuestion", () => {
  it("最初の問題は引き直さない", () => {
    expect(generateNextScoreTableQuestion(undefined, queue([1, 2])).han).toBe(
      1,
    );
  });

  it("直前と同じ表示なら引き直す", () => {
    expect(
      generateNextScoreTableQuestion(question(1), queue([1, 1, 3])).han,
    ).toBe(3);
  });

  it("候補が 1 種類しかなければ打ち切って同じ表示を返す", () => {
    expect(generateNextScoreTableQuestion(question(1), queue([1])).han).toBe(1);
  });
});
