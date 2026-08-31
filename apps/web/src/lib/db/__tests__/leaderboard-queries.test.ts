import { describe, expect, it, vi, beforeEach } from "vitest";

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}));

let selectCallIndex = 0;
let selectReturnValues: unknown[][] = [];
/** `db.select()` が返したチェーンを呼ばれた順に控える（一覧側=0 / 件数側=1） */
let selectChains: QueryChainMock[] = [];

function setupSelectChains(...chains: unknown[][]) {
  selectCallIndex = 0;
  selectReturnValues = chains;
  selectChains = [];
}

vi.mock("../index", () => ({
  db: {
    get select() {
      return (..._args: unknown[]) => {
        const idx = selectCallIndex++;
        const resolveValue =
          idx < selectReturnValues.length ? selectReturnValues[idx] : [];
        const chain = createQueryChain(resolveValue);
        selectChains.push(chain);
        return chain;
      };
    },
    get selectDistinctOn() {
      return (..._args: unknown[]) => {
        // For monthly ranking subquery, return a chain that .as() returns an object
        const chain = createQueryChain([]);
        // Override .as to return a subquery reference object
        (chain as Record<string, unknown>)["as"] = vi.fn(() => ({
          userId: "sub_user_id",
          score: "sub_score",
          incorrectAnswers: "sub_incorrect_answers",
          timeTaken: "sub_time_taken",
        }));
        return chain;
      };
    },
    execute: mockExecute,
  },
}));

vi.mock("../schema", async () => await import("@/test/schema-mock"));

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import {
  getAllTimeRanking,
  getMonthlyRanking,
  startOfCurrentMonth,
} from "../leaderboard-queries";
import { notHiddenFromLeaderboard } from "../leaderboard-visibility";
import {
  getUserAllTimeRankedRow,
  getUserMonthlyRankedRow,
} from "../user-rank-queries";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

/**
 * SQL が返す生のランキング行（snake_case）を組み立てる
 *
 * `mapRawRankedRow` の変換を検証するためのモック入力。既定は
 * 「表示名あり・アバターなし・1位」で、見たい差分だけ上書きする。
 */
function rawRankedRow(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "user-a",
    username: "alice",
    score: 20,
    incorrect_answers: 0,
    time_taken: 30,
    display_name: "Alice",
    avatar_url: null,
    rank: 1,
    ...overrides,
  };
}

describe("startOfCurrentMonth", () => {
  it("当月1日の UTC 0 時を返す", () => {
    expect(
      startOfCurrentMonth(new Date("2026-08-15T12:34:56.789Z")).toISOString(),
    ).toBe("2026-08-01T00:00:00.000Z");
  });

  it("月初の瞬間そのものを渡してもその月に留まる", () => {
    expect(
      startOfCurrentMonth(new Date("2026-08-01T00:00:00.000Z")).toISOString(),
    ).toBe("2026-08-01T00:00:00.000Z");
  });

  it("月末最後のミリ秒でもまだ当月を指す", () => {
    expect(
      startOfCurrentMonth(new Date("2026-08-31T23:59:59.999Z")).toISOString(),
    ).toBe("2026-08-01T00:00:00.000Z");
  });

  it("年をまたぐ（1月は前年12月へ戻らない）", () => {
    expect(
      startOfCurrentMonth(new Date("2027-01-01T00:00:00.000Z")).toISOString(),
    ).toBe("2027-01-01T00:00:00.000Z");
  });

  // 月の境界は UTC で切る。ヒートマップ（JST 基準）とは基準が異なるため、
  // JST では翌月に入っていても月間ランキングはまだ前月を集計する。
  // 現行仕様であり、変えるならランキングの母集団定義ごと変わる。
  it("JST では翌月でも UTC がまだ当月なら当月を指す", () => {
    // JST 2026-09-01 08:30 = UTC 2026-08-31 23:30
    expect(
      startOfCurrentMonth(new Date("2026-08-31T23:30:00.000Z")).toISOString(),
    ).toBe("2026-08-01T00:00:00.000Z");
  });
});

describe("getAllTimeRanking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallIndex = 0;
  });

  it("returns rows with null coalesced to undefined", async () => {
    setupSelectChains(
      // First select: data rows
      [
        {
          userId: "user-a",
          username: "alice",
          score: 20,
          incorrectAnswers: 0,
          timeTaken: 30,
          displayName: "Alice",
          avatarUrl: null,
        },
        {
          userId: "user-b",
          username: "bob",
          score: 18,
          incorrectAnswers: 1,
          timeTaken: 40,
          displayName: null,
          avatarUrl: null,
        },
      ],
      // Second select: count
      [{ count: 2 }],
    );

    const result = await getAllTimeRanking("jantou_fu", "default", 0, 20);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({
      userId: "user-a",
      username: "alice",
      score: 20,
      incorrectAnswers: 0,
      timeTaken: 30,
      displayName: "Alice",
      avatarUrl: undefined,
    });
    expect(result.rows[1]).toEqual({
      userId: "user-b",
      username: "bob",
      score: 18,
      incorrectAnswers: 1,
      timeTaken: 40,
      displayName: undefined,
      avatarUrl: undefined,
    });
  });

  it("returns total count from the count query", async () => {
    setupSelectChains(
      [
        {
          userId: "user-a",
          username: "a",
          score: 1,
          incorrectAnswers: 0,
          timeTaken: 10,
          displayName: null,
          avatarUrl: null,
        },
      ],
      [{ count: 42 }],
    );

    const result = await getAllTimeRanking("jantou_fu", "default", 0, 20);

    expect(result.total).toBe(42);
  });

  it("returns total 0 when count row is missing", async () => {
    setupSelectChains([], []);

    const result = await getAllTimeRanking("jantou_fu", "default", 0, 20);

    expect(result.total).toBe(0);
    expect(result.rows).toEqual([]);
  });

  // 一覧だけ絞ると total が実際の行数より多くなり、末尾に空ページができる
  it("applies the visibility filter to both the rows query and the count query", async () => {
    setupSelectChains([], [{ count: 0 }]);

    await getAllTimeRanking("jantou_fu", "default", 0, 20);

    expect(selectChains).toHaveLength(2);
    for (const chain of selectChains) {
      expect(chain.innerJoin).toHaveBeenCalled();
      expect(chain.where).toHaveBeenCalledWith(
        expect.objectContaining({
          op: "and",
          args: expect.arrayContaining([notHiddenFromLeaderboard()]),
        }),
      );
    }
  });
});

describe("getMonthlyRanking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallIndex = 0;
  });

  it("returns rows with null coalesced to undefined", async () => {
    setupSelectChains(
      // First select (outer query with data rows)
      [
        {
          userId: "user-a",
          username: "alice",
          score: 15,
          incorrectAnswers: 1,
          timeTaken: 35,
          displayName: null,
          avatarUrl: null,
        },
      ],
      // Second select (count)
      [{ count: 1 }],
    );

    const result = await getMonthlyRanking("jantou_fu", "default", 0, 20);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      userId: "user-a",
      score: 15,
      displayName: undefined,
      avatarUrl: undefined,
    });
    expect(result.total).toBe(1);
  });

  it("returns empty results when no monthly data", async () => {
    setupSelectChains([], []);

    const result = await getMonthlyRanking("jantou_fu", "default", 0, 20);

    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("applies the visibility filter to both the rows query and the count query", async () => {
    setupSelectChains([], [{ count: 0 }]);

    await getMonthlyRanking("jantou_fu", "default", 0, 20);

    expect(selectChains).toHaveLength(2);
    for (const chain of selectChains) {
      expect(chain.innerJoin).toHaveBeenCalled();
      expect(chain.where).toHaveBeenCalledWith(notHiddenFromLeaderboard());
    }
  });
});

describe("getUserAllTimeRankedRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped row when user exists in ranking", async () => {
    mockExecute.mockResolvedValue([rawRankedRow()]);

    const result = await getUserAllTimeRankedRow(
      "user-a",
      "jantou_fu",
      "default",
    );

    expect(result).toEqual({
      rank: 1,
      userId: "user-a",
      username: "alice",
      score: 20,
      incorrectAnswers: 0,
      timeTaken: 30,
      displayName: "Alice",
      avatarUrl: undefined,
    });
  });

  it("returns undefined when user is not in ranking", async () => {
    mockExecute.mockResolvedValue([]);

    const result = await getUserAllTimeRankedRow(
      "user-not-found",
      "jantou_fu",
      "default",
    );

    expect(result).toBeUndefined();
  });

  it("maps null display_name and avatar_url to undefined", async () => {
    mockExecute.mockResolvedValue([
      rawRankedRow({
        user_id: "user-b",
        username: "bob",
        score: 10,
        incorrect_answers: 2,
        time_taken: 50,
        display_name: null,
        rank: 3,
      }),
    ]);

    const result = await getUserAllTimeRankedRow(
      "user-b",
      "jantou_fu",
      "default",
    );

    expect(result?.displayName).toBeUndefined();
    expect(result?.avatarUrl).toBeUndefined();
  });

  it("preserves non-null display_name and avatar_url", async () => {
    mockExecute.mockResolvedValue([
      rawRankedRow({
        user_id: "user-c",
        username: "charlie",
        score: 15,
        incorrect_answers: 1,
        time_taken: 40,
        display_name: "Charlie",
        avatar_url: "https://example.com/avatar.png",
        rank: 2,
      }),
    ]);

    const result = await getUserAllTimeRankedRow(
      "user-c",
      "jantou_fu",
      "default",
    );

    expect(result?.displayName).toBe("Charlie");
    expect(result?.avatarUrl).toBe("https://example.com/avatar.png");
  });
});

describe("getUserMonthlyRankedRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped row when user exists in monthly ranking", async () => {
    mockExecute.mockResolvedValue([
      rawRankedRow({
        user_id: "user-c",
        username: "charlie",
        score: 12,
        incorrect_answers: 1,
        time_taken: 45,
        display_name: "Charlie",
        avatar_url: "https://example.com/avatar.png",
        rank: 2,
      }),
    ]);

    const result = await getUserMonthlyRankedRow(
      "user-c",
      "jantou_fu",
      "default",
    );

    expect(result).toEqual({
      rank: 2,
      userId: "user-c",
      username: "charlie",
      score: 12,
      incorrectAnswers: 1,
      timeTaken: 45,
      displayName: "Charlie",
      avatarUrl: "https://example.com/avatar.png",
    });
  });

  it("returns undefined when user has no monthly results", async () => {
    mockExecute.mockResolvedValue([]);

    const result = await getUserMonthlyRankedRow(
      "user-absent",
      "jantou_fu",
      "default",
    );

    expect(result).toBeUndefined();
  });
});
