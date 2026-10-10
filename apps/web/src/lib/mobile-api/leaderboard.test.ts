import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuthorize,
  mockAuthorizeOptional,
  mockHidden,
  mockBlocked,
  mockGetLeaderboard,
  mockGetUserRanks,
} = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockAuthorizeOptional: vi.fn(),
  mockHidden: vi.fn(),
  mockBlocked: vi.fn(),
  mockGetLeaderboard: vi.fn(),
  mockGetUserRanks: vi.fn(),
}));

vi.mock("./auth", () => ({
  authorizeMobileRequest: mockAuthorize,
  authorizeOptionalMobileRequest: mockAuthorizeOptional,
}));
vi.mock("../db/leaderboard-visibility", () => ({
  isHiddenFromLeaderboard: mockHidden,
}));
vi.mock("../blocks/blocks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../blocks/blocks")>()),
  getBlockedUserIds: mockBlocked,
}));
vi.mock("../leaderboard/get-leaderboard", () => ({
  LEADERBOARD_PAGE_SIZE: 20,
  getLeaderboard: mockGetLeaderboard,
}));
vi.mock("../leaderboard/user-ranks", () => ({
  getUserRanks: mockGetUserRanks,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import {
  handleReadLeaderboard,
  handleReadLeaderboardRanks,
} from "./leaderboard";

const URL_BASE = "https://example.test/api/mobile/v1/leaderboard";

function row(rank: number, userId: string) {
  return {
    rank,
    userId,
    username: `name-${userId}`,
    displayName: undefined,
    avatarUrl: undefined,
    score: 30 - rank,
    incorrectAnswers: 0,
    timeTaken: 60,
  };
}

const signedIn = {
  ok: true,
  viewer: { user: { id: "me" }, profile: { username: "me" } },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "me" },
    profile: { username: "me" },
  });
  mockAuthorizeOptional.mockResolvedValue({ ok: true, viewer: undefined });
  mockHidden.mockResolvedValue(false);
  mockBlocked.mockResolvedValue(new Set());
  mockGetUserRanks.mockResolvedValue([]);
});

describe("handleReadLeaderboardRanks", () => {
  it("期間ごとの本人の順位を返す", async () => {
    mockGetUserRanks.mockResolvedValue([
      { menuType: "jantou_fu", variant: "default", rank: 3 },
    ]);

    const response = await handleReadLeaderboardRanks(
      new Request(`${URL_BASE}/ranks?period=monthly`),
    );

    expect(mockGetUserRanks).toHaveBeenCalledWith("me", "monthly");
    expect(await response.json()).toEqual({
      ranks: [{ menuType: "jantou_fu", variant: "default", rank: 3 }],
      viewerHidden: false,
    });
  });

  it("非表示の設定中は順位を引かずに空で返す", async () => {
    mockHidden.mockResolvedValue(true);

    const response = await handleReadLeaderboardRanks(
      new Request(`${URL_BASE}/ranks?period=all-time`),
    );

    expect(mockGetUserRanks).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ ranks: [], viewerHidden: true });
  });

  it("不正な期間は 404", async () => {
    const response = await handleReadLeaderboardRanks(
      new Request(`${URL_BASE}/ranks?period=weekly`),
    );

    expect(response.status).toBe(404);
  });
});

describe("handleReadLeaderboard", () => {
  const read = (query = "") =>
    handleReadLeaderboard(
      new Request(`${URL_BASE}/all-time/yaku-han${query}`),
      "all-time",
      "yaku-han",
    );

  it("ゲストには ID を出さず、本人の行も順位の行も無い", async () => {
    mockGetLeaderboard.mockResolvedValue({
      rows: [row(1, "a")],
      totalCount: 1,
      currentUserRank: undefined,
    });

    const body = await (await read("?variant=kuisagari")).json();

    expect(mockGetLeaderboard).toHaveBeenCalledWith(
      { menuType: "yaku_han", variant: "kuisagari" },
      "all-time",
      1,
      undefined,
    );
    expect(body).toEqual({
      rows: [
        {
          rank: 1,
          username: "name-a",
          score: 29,
          incorrectAnswers: 0,
          timeTaken: 60,
          isViewer: false,
        },
      ],
      page: 1,
      totalPages: 1,
      totalCount: 1,
      viewerHidden: false,
    });
  });

  it("ログイン中は本人の行に印を付け、ブロックした人の行を順位を数え直さずに除く", async () => {
    mockAuthorizeOptional.mockResolvedValue(signedIn);
    mockBlocked.mockResolvedValue(new Set(["b"]));
    mockGetLeaderboard.mockResolvedValue({
      rows: [row(1, "a"), row(2, "b"), row(3, "me")],
      totalCount: 3,
      currentUserRank: undefined,
    });

    const body = await (await read()).json();

    expect(
      body.rows.map((r: { rank: number; isViewer: boolean }) => [
        r.rank,
        r.isViewer,
      ]),
    ).toEqual([
      [1, false],
      [3, true],
    ]);
    expect(body.totalCount).toBe(3);
  });

  it("ページ外の本人の順位を添える", async () => {
    mockAuthorizeOptional.mockResolvedValue(signedIn);
    mockGetLeaderboard.mockResolvedValue({
      rows: [row(1, "a")],
      totalCount: 30,
      currentUserRank: row(25, "me"),
    });

    const body = await (await read()).json();

    expect(body.viewerRow).toMatchObject({ rank: 25, isViewer: true });
    expect(body.totalPages).toBe(2);
  });

  it("非表示の設定中は本人の順位を引かない", async () => {
    mockAuthorizeOptional.mockResolvedValue(signedIn);
    mockHidden.mockResolvedValue(true);
    mockGetLeaderboard.mockResolvedValue({
      rows: [],
      totalCount: 0,
      currentUserRank: undefined,
    });

    const body = await (await read()).json();

    expect(mockGetLeaderboard).toHaveBeenCalledWith(
      expect.anything(),
      "all-time",
      1,
      undefined,
    );
    expect(body.viewerHidden).toBe(true);
  });

  it("範囲外のページは最後のページに丸めて引き直す", async () => {
    mockGetLeaderboard
      .mockResolvedValueOnce({
        rows: [],
        totalCount: 25,
        currentUserRank: undefined,
      })
      .mockResolvedValueOnce({
        rows: [row(21, "x")],
        totalCount: 25,
        currentUserRank: undefined,
      });

    const body = await (await read("?page=9")).json();

    expect(mockGetLeaderboard).toHaveBeenLastCalledWith(
      expect.anything(),
      "all-time",
      2,
      undefined,
    );
    expect(body.page).toBe(2);
    expect(body.rows).toHaveLength(1);
  });

  it("ランキングを持たない練習は 404", async () => {
    const response = await handleReadLeaderboard(
      new Request(`${URL_BASE}/all-time/mangan-exam`),
      "all-time",
      "mangan-exam",
    );

    expect(response.status).toBe(404);
  });

  it("取得に失敗したら 500", async () => {
    mockGetLeaderboard.mockResolvedValue(undefined);

    const response = await read();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});
