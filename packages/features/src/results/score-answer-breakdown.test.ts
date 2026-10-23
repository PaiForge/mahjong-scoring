import type { ScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { buildScoreAnswerBreakdown } from "./score-answer-breakdown";

const FU_DETAILS = [{ reason: "副底", fu: 20 }];
const YAKU_DETAILS = [{ name: "立直", han: 1 }];

function questionOf(
  answer: Pick<ScoreQuestion["answer"], "han" | "scoreLevel">,
): ScoreQuestion {
  return {
    fuDetails: FU_DETAILS,
    yakuDetails: YAKU_DETAILS,
    answer: { fu: 70, payment: { type: "ron", amount: 8000 }, ...answer },
  } as unknown as ScoreQuestion;
}

const t = (key: string) => key;

describe("buildScoreAnswerBreakdown", () => {
  it("符で満貫に届いた 4 翻以下の手は符の内訳を出す", () => {
    expect(
      buildScoreAnswerBreakdown(
        questionOf({ han: 3, scoreLevel: "Mangan" }),
        t,
        {
          yakuGiven: false,
        },
      ),
    ).toEqual({
      fu: { details: FU_DETAILS, answer: 70 },
      yakuDetails: YAKU_DETAILS,
      yakuNote: undefined,
    });
  });

  it("5 翻以上は符の内訳を出さない", () => {
    expect(
      buildScoreAnswerBreakdown(
        questionOf({ han: 5, scoreLevel: "Mangan" }),
        t,
        {
          yakuGiven: false,
        },
      ).fu,
    ).toBeUndefined();
  });

  it("役一覧が与件の練習では翻数の内訳を出さず、符の内訳だけを出す", () => {
    expect(
      buildScoreAnswerBreakdown(
        questionOf({ han: 3, scoreLevel: "Mangan" }),
        t,
        {
          yakuGiven: true,
        },
      ),
    ).toEqual({
      fu: { details: FU_DETAILS, answer: 70 },
      yakuDetails: [],
      yakuNote: undefined,
    });
  });
});
