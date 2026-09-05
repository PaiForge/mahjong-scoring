import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSelectSequenceMock } from "@/test/drizzle-mock";

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const selectSequence = createSelectSequenceMock();

vi.mock("server-only", () => ({}));

vi.mock("../index", () => ({
  db: {
    get select() {
      return selectSequence.select;
    },
  },
}));

vi.mock("../schema", async () => await import("@/test/schema-mock"));

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { asc, desc, lte, ne } from "drizzle-orm";

import { getScoreComparison } from "../score-comparison-queries";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const USER_ID = "user-a";
const MENU_TYPE = "jantou_fu" as const;
const CURRENT_ID = "result-current";
const CURRENT_ROW = {
  id: CURRENT_ID,
  score: 10,
  incorrectAnswers: 1,
  timeTaken: 60,
  createdAt: new Date("2026-08-31T12:00:00.000Z"),
};
const CURRENT_SCORE = { score: 10, incorrectAnswers: 1, timeTaken: 60 };
const BEST_SCORE = { score: 12, incorrectAnswers: 0, timeTaken: 55 };
const LAST_SCORE = { score: 8, incorrectAnswers: 2, timeTaken: 58 };

describe("getScoreComparison", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("grant あり: 今回・ベスト・前回の 3 クエリで比較サマリを返す", async () => {
    selectSequence.setResults([CURRENT_ROW], [BEST_SCORE], [LAST_SCORE]);

    const result = await getScoreComparison(USER_ID, MENU_TYPE, CURRENT_ID);

    expect(result).toEqual({
      current: CURRENT_SCORE,
      previousBest: BEST_SCORE,
      previousLast: LAST_SCORE,
    });
    expect(selectSequence.chains).toHaveLength(3);
    // 過去記録の絞り込みに今回の行の除外条件（id / createdAt）が入る
    expect(ne).toHaveBeenCalledWith("id", CURRENT_ID);
    expect(lte).toHaveBeenCalledWith("created_at", CURRENT_ROW.createdAt);
  });

  it("ベストはランキングと同じ順序で引く", async () => {
    selectSequence.setResults([CURRENT_ROW], [BEST_SCORE], [LAST_SCORE]);

    await getScoreComparison(USER_ID, MENU_TYPE, CURRENT_ID);

    // 「これまでのベスト」は自己ベスト更新の判定と同じ順序規則で決まる。
    // スコア降順だけで引くと、同点でミスが少ない回がベストにならない
    expect(selectSequence.chains[1].orderBy).toHaveBeenCalledWith(
      { op: "desc", args: ["score"] },
      { op: "asc", args: ["incorrect_answers"] },
      { op: "asc", args: ["time_taken"] },
    );
    // 「前回」は時系列で最新の 1 件
    expect(selectSequence.chains[2].orderBy).toHaveBeenCalledWith({
      op: "desc",
      args: ["created_at"],
    });
    expect(desc).toHaveBeenCalledWith("score");
    expect(asc).toHaveBeenCalledWith("incorrect_answers");
  });

  it("grant ありでも今回の行が特定できなければ基準点なしで過去記録だけ返す", async () => {
    selectSequence.setResults([], [BEST_SCORE], [LAST_SCORE]);

    const result = await getScoreComparison(USER_ID, MENU_TYPE, CURRENT_ID);

    expect(result).toEqual({
      current: undefined,
      previousBest: BEST_SCORE,
      previousLast: LAST_SCORE,
    });
    // 除外できる行が無いため、除外条件は付かない
    expect(ne).not.toHaveBeenCalled();
    expect(lte).not.toHaveBeenCalled();
  });

  it("grant なし: 今回の行を引かず 2 クエリで過去記録だけ返す", async () => {
    selectSequence.setResults([LAST_SCORE], [LAST_SCORE]);

    const result = await getScoreComparison(USER_ID, MENU_TYPE, undefined);

    expect(result).toEqual({
      current: undefined,
      previousBest: LAST_SCORE,
      previousLast: LAST_SCORE,
    });
    expect(selectSequence.chains).toHaveLength(2);
  });

  it("過去記録が無ければベスト・前回とも undefined", async () => {
    selectSequence.setResults([CURRENT_ROW], [], []);

    const result = await getScoreComparison(USER_ID, MENU_TYPE, CURRENT_ID);

    expect(result).toEqual({
      current: CURRENT_SCORE,
      previousBest: undefined,
      previousLast: undefined,
    });
  });
});
