import { beforeEach, describe, expect, it, vi } from "vitest";

import { LEADERBOARD_BOARDS } from "@mahjong-scoring/features/leaderboard/boards";
import type { PracticeMenuType } from "@mahjong-scoring/features/practice-menu-types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockGetUserRankedRow, mockUnstableCache } = vi.hoisted(() => ({
  mockGetUserRankedRow: vi.fn(),
  mockUnstableCache: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: mockUnstableCache,
}));

vi.mock("../period-queries", () => ({
  getQueriesForPeriod: vi.fn((period: string) => ({
    cacheKey: `${period}:key`,
    getRanking: vi.fn(),
    getUserRankedRow: mockGetUserRankedRow,
  })),
}));

import { getUserRanks } from "../user-ranks";
import { practiceBoardKey } from "@mahjong-scoring/features/practice-menu-types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const [FIRST_BOARD, SECOND_BOARD] = LEADERBOARD_BOARDS;

/** 土俵ごとの順位を返す `getUserRankedRow` の差し替え */
function rankByBoard(ranks: ReadonlyMap<string, number>) {
  return (_userId: string, module: PracticeMenuType, variant: string) => {
    const rank = ranks.get(practiceBoardKey({ menuType: module, variant }));
    return Promise.resolve(rank === undefined ? undefined : { rank });
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getUserRanks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    // unstable_cache はコールバックをそのまま実行する
    mockUnstableCache.mockImplementation((fn: () => unknown) => fn);
    mockGetUserRankedRow.mockResolvedValue(undefined);
  });

  it("順位のある土俵だけを土俵一覧の順で返す", async () => {
    mockGetUserRankedRow.mockImplementation(
      rankByBoard(
        new Map([
          [practiceBoardKey(SECOND_BOARD), 7],
          [practiceBoardKey(FIRST_BOARD), 3],
        ]),
      ),
    );

    expect(await getUserRanks("user-1", "all-time")).toEqual([
      { ...FIRST_BOARD, rank: 3 },
      { ...SECOND_BOARD, rank: 7 },
    ]);
    expect(mockGetUserRankedRow).toHaveBeenCalledTimes(
      LEADERBOARD_BOARDS.length,
    );
  });

  it("1 つの土俵の取得が失敗しても他の土俵の順位は返す", async () => {
    mockGetUserRankedRow.mockImplementation(
      (userId: string, module: PracticeMenuType, variant: string) => {
        if (
          practiceBoardKey({ menuType: module, variant }) ===
          practiceBoardKey(FIRST_BOARD)
        ) {
          return Promise.reject(new Error("boom"));
        }
        return rankByBoard(new Map([[practiceBoardKey(SECOND_BOARD), 7]]))(
          userId,
          module,
          variant,
        );
      },
    );

    expect(await getUserRanks("user-1", "monthly")).toEqual([
      { ...SECOND_BOARD, rank: 7 },
    ]);
  });

  it("キャッシュのキーに集計の範囲（月間なら年月）を含める", async () => {
    await getUserRanks("user-1", "monthly");

    expect(mockUnstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["user-rank", "user-1", "monthly:key", practiceBoardKey(FIRST_BOARD)],
      expect.anything(),
    );
  });

  it("失敗した土俵はキャッシュの中から投げる（「ランクなし」を保存しない）", async () => {
    const cached: (() => Promise<unknown>)[] = [];
    mockUnstableCache.mockImplementation((fn: () => Promise<unknown>) => {
      cached.push(fn);
      return fn;
    });
    mockGetUserRankedRow.mockRejectedValue(new Error("boom"));

    await getUserRanks("user-1", "all-time");

    expect(cached).toHaveLength(LEADERBOARD_BOARDS.length);
    await expect(cached[0]()).rejects.toThrow("boom");
  });

  it("失敗した土俵をキー付きで記録する", async () => {
    mockGetUserRankedRow.mockImplementation(
      (_userId: string, module: PracticeMenuType, variant: string) =>
        practiceBoardKey({ menuType: module, variant }) ===
        practiceBoardKey(FIRST_BOARD)
          ? Promise.reject(new Error("boom"))
          : Promise.resolve(undefined),
    );

    await getUserRanks("user-1", "all-time");

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      `[getUserRanks] ${practiceBoardKey(FIRST_BOARD)}: failed to fetch user rank:`,
      "boom",
    );
  });
});
