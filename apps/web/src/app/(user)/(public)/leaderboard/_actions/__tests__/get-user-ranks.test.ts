import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LeaderboardModule } from "../../_lib/types";
import { BOARDS, boardKey } from "../../_lib/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockGetOptionalUser, mockGetUserRankedRow, mockUnstableCache } =
  vi.hoisted(() => ({
    mockGetOptionalUser: vi.fn(),
    mockGetUserRankedRow: vi.fn(),
    mockUnstableCache: vi.fn(),
  }));

vi.mock("next/cache", () => ({
  unstable_cache: mockUnstableCache,
}));

vi.mock("@/lib/auth", () => ({
  getOptionalUser: mockGetOptionalUser,
}));

vi.mock("../../_lib/period-queries", () => ({
  getQueriesForPeriod: vi.fn(() => ({
    getRanking: vi.fn(),
    getUserRankedRow: mockGetUserRankedRow,
  })),
}));

import { getUserRanks } from "../get-user-ranks";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const [FIRST_BOARD, SECOND_BOARD] = BOARDS;

/** 土俵ごとの順位を返す `getUserRankedRow` の差し替え */
function rankByBoard(ranks: ReadonlyMap<string, number>) {
  return (_userId: string, module: LeaderboardModule, variant: string) => {
    const rank = ranks.get(boardKey({ module, variant }));
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
    mockGetOptionalUser.mockResolvedValue({ id: "user-1" });
    mockGetUserRankedRow.mockResolvedValue(undefined);
  });

  it("未ログインなら空配列を返し、土俵を引かない", async () => {
    mockGetOptionalUser.mockResolvedValue(undefined);

    expect(await getUserRanks("all-time")).toEqual([]);
    expect(mockGetUserRankedRow).not.toHaveBeenCalled();
  });

  it("順位のある土俵だけを土俵一覧の順で返す", async () => {
    mockGetUserRankedRow.mockImplementation(
      rankByBoard(
        new Map([
          [boardKey(SECOND_BOARD), 7],
          [boardKey(FIRST_BOARD), 3],
        ]),
      ),
    );

    expect(await getUserRanks("all-time")).toEqual([
      { ...FIRST_BOARD, rank: 3 },
      { ...SECOND_BOARD, rank: 7 },
    ]);
    expect(mockGetUserRankedRow).toHaveBeenCalledTimes(BOARDS.length);
  });

  it("1 つの土俵の取得が失敗しても他の土俵の順位は返す", async () => {
    mockGetUserRankedRow.mockImplementation(
      (userId: string, module: LeaderboardModule, variant: string) => {
        if (boardKey({ module, variant }) === boardKey(FIRST_BOARD)) {
          return Promise.reject(new Error("boom"));
        }
        return rankByBoard(new Map([[boardKey(SECOND_BOARD), 7]]))(
          userId,
          module,
          variant,
        );
      },
    );

    expect(await getUserRanks("monthly")).toEqual([
      { ...SECOND_BOARD, rank: 7 },
    ]);
  });

  it("失敗した土俵をキー付きで記録する", async () => {
    mockGetUserRankedRow.mockImplementation(
      (_userId: string, module: LeaderboardModule, variant: string) =>
        boardKey({ module, variant }) === boardKey(FIRST_BOARD)
          ? Promise.reject(new Error("boom"))
          : Promise.resolve(undefined),
    );

    await getUserRanks("all-time");

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      `[getUserRanks] ${boardKey(FIRST_BOARD)}: failed to fetch user rank:`,
      "boom",
    );
  });
});
