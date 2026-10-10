import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockHidden, mockGetUserRanks } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockHidden: vi.fn(),
  mockGetUserRanks: vi.fn(),
}));

vi.mock("./auth", () => ({
  authorizeMobileRequest: mockAuthorize,
}));
vi.mock("../db/leaderboard-visibility", () => ({
  isHiddenFromLeaderboard: mockHidden,
}));
vi.mock("../leaderboard/user-ranks", () => ({
  getUserRanks: mockGetUserRanks,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { handleReadLeaderboardRanks } from "./leaderboard";

const URL_BASE = "https://example.test/api/mobile/v1/leaderboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "me" },
    profile: { username: "me" },
  });
  mockHidden.mockResolvedValue(false);
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
