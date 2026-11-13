import { describe, expect, it } from "vitest";

import { EMPTY_QUOTA_COUNTS, parseQuotaCounts } from "./limits";

describe("parseQuotaCounts", () => {
  it("保存した回数を読む", () => {
    expect(parseQuotaCounts({ "agari-score": 2, "tenpai-score": 1 })).toEqual({
      ...EMPTY_QUOTA_COUNTS,
      "agari-score": 2,
      "tenpai-score": 1,
    });
  });

  it("入れ物の形が違えば undefined", () => {
    expect(parseQuotaCounts(undefined)).toBeUndefined();
    expect(parseQuotaCounts(null)).toBeUndefined();
    expect(parseQuotaCounts("agari-score")).toBeUndefined();
    expect(parseQuotaCounts([1, 2])).toBeUndefined();
  });

  it("壊れた数の練習だけ 0 にし、他の練習の数は捨てない", () => {
    expect(
      parseQuotaCounts({
        "agari-score": -1,
        "tenpai-score": 3,
        "fu-score-exam": 1.5,
        "score-exam": "2",
      }),
    ).toEqual({ ...EMPTY_QUOTA_COUNTS, "tenpai-score": 3 });
  });

  it("対象外の練習は読まず、無い練習は 0 で埋める", () => {
    expect(parseQuotaCounts({ "jantou-fu": 9, "agari-score": 1 })).toEqual({
      ...EMPTY_QUOTA_COUNTS,
      "agari-score": 1,
    });
  });
});
