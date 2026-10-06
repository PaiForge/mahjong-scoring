import { describe, expect, it } from "vitest";

import { AnswerOutcome } from "../../results/result-schemas";
import { buildYakuComparisonChips } from "./answer-comparison";

const ORDER = ["立直", "平和", "断么九", "役牌 中"];

describe("buildYakuComparisonChips", () => {
  it("表示順に並べ、選べた役・選び忘れ・余分を判定する", () => {
    expect(
      buildYakuComparisonChips(
        ["断么九", "立直", "平和"],
        ORDER,
        ["立直", "断么九"],
        ["断么九", "平和"],
        AnswerOutcome.Incorrect,
      ),
    ).toEqual([
      { yakuName: "立直", state: "missed" },
      { yakuName: "平和", state: "incorrect" },
      { yakuName: "断么九", state: "correct" },
    ]);
  });

  it("時間切れは成立していた役を成立として出す", () => {
    expect(
      buildYakuComparisonChips(
        ["立直", "断么九"],
        ORDER,
        ["立直", "断么九"],
        undefined,
        AnswerOutcome.TimeUp,
      ),
    ).toEqual([
      { yakuName: "立直", state: "correct" },
      { yakuName: "断么九", state: "correct" },
    ]);
  });

  it("表示順に無い役名は出さない", () => {
    expect(
      buildYakuComparisonChips(["不明"], ORDER, [], [], undefined),
    ).toEqual([]);
  });
});
