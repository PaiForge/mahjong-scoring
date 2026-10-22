import { describe, expect, it } from "vitest";
import { finalResultOf, finishReasonAfterAnswer } from "./finish-decision";

describe("finishReasonAfterAnswer", () => {
  it("ミスが上限に達したら mistakeLimit", () => {
    expect(
      finishReasonAfterAnswer(
        { correctCount: 2, incorrectCount: 3 },
        { mistakeLimit: 3 },
      ),
    ).toBe("mistakeLimit");
  });

  it("目標の正解数に届いたら goalReached。目標が無ければ続ける", () => {
    const counts = { correctCount: 5, incorrectCount: 1 };
    expect(
      finishReasonAfterAnswer(counts, { mistakeLimit: 3, goalCount: 5 }),
    ).toBe("goalReached");
    expect(
      finishReasonAfterAnswer(counts, { mistakeLimit: 3 }),
    ).toBeUndefined();
  });

  it("どちらにも届いていなければ続ける", () => {
    expect(
      finishReasonAfterAnswer(
        { correctCount: 1, incorrectCount: 1 },
        { mistakeLimit: 3, goalCount: 5 },
      ),
    ).toBeUndefined();
  });
});

describe("finalResultOf", () => {
  it("合計を足して理由と時刻を添える", () => {
    expect(
      finalResultOf({ correctCount: 4, incorrectCount: 2 }, "timeUp", 1000),
    ).toEqual({
      correctCount: 4,
      incorrectCount: 2,
      totalCount: 6,
      reason: "timeUp",
      finishedAt: 1000,
    });
  });
});
