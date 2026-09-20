import { describe, expect, it } from "vitest";
import type { Payment } from "@mahjong-scoring/core";
import { ScoreLevel } from "@mahjong-scoring/core/core/constants";
import { scoreAnswerToUserAnswer } from "../payment-adapter";

describe("scoreAnswerToUserAnswer", () => {
  it.each([
    [{ type: "ron", amount: 2000 }, { score: 2000 }],
    [{ type: "oyaTsumo", amount: 1000 }, { score: 1000 }],
    [
      { type: "koTsumo", amount: [500, 1000] },
      { scoreFromKo: 500, scoreFromOya: 1000 },
    ],
  ] satisfies readonly [Payment, object][])(
    "%j を対応する回答欄に割り当てる",
    (payment, fields) => {
      expect(
        scoreAnswerToUserAnswer({
          han: 2,
          fu: 30,
          payment,
          scoreLevel: ScoreLevel.Normal,
          yakumanMultiplier: 0,
        }),
      ).toEqual({ han: 2, fu: 30, yakus: [], ...fields });
    },
  );

  it("満貫でも元の符を保持する", () => {
    expect(
      scoreAnswerToUserAnswer({
        han: 5,
        fu: 30,
        payment: { type: "ron", amount: 8000 },
        scoreLevel: ScoreLevel.Mangan,
        yakumanMultiplier: 0,
      }),
    ).toEqual({ han: 5, fu: 30, score: 8000, yakus: [] });
  });
});
