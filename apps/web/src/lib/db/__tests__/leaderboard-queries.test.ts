import { describe, expect, it, vi, beforeEach } from "vitest";

import { createQueryChain } from "@/test/drizzle-mock";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}));

let selectCallIndex = 0;
let selectReturnValues: unknown[][] = [];

function setupSelectChains(...chains: unknown[][]) {
  selectCallIndex = 0;
  selectReturnValues = chains;
}

vi.mock("../index", () => ({
  db: {
    get select() {
      return (..._args: unknown[]) => {
        const idx = selectCallIndex++;
        const resolveValue =
          idx < selectReturnValues.length ? selectReturnValues[idx] : [];
        return createQueryChain(resolveValue);
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

vi.mock("../schema", () => ({
  challengeBestScores: {
    userId: "user_id",
    menuType: "menu_type",
    leaderboardKey: "leaderboard_key",
    score: "score",
    incorrectAnswers: "incorrect_answers",
    timeTaken: "time_taken",
  },
  challengeResults: {
    userId: "user_id",
    menuType: "menu_type",
    leaderboardKey: "leaderboard_key",
    score: "score",
    incorrectAnswers: "incorrect_answers",
    timeTaken: "time_taken",
    createdAt: "created_at",
  },
  profiles: {
    id: "id",
    username: "username",
    displayName: "display_name",
    avatarUrl: "avatar_url",
  },
}));

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { getAllTimeRanking, getMonthlyRanking } from "../leaderboard-queries";
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
