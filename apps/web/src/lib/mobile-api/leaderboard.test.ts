import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockHidden, mockGetUserRanks, mockSaveVisibility } =
  vi.hoisted(() => ({
    mockAuthorize: vi.fn(),
    mockHidden: vi.fn(),
    mockGetUserRanks: vi.fn(),
    mockSaveVisibility: vi.fn(),
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
vi.mock("../users/leaderboard-visibility", () => ({
  saveLeaderboardVisibility: mockSaveVisibility,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import {
  handleReadLeaderboardRanks,
  handleReadLeaderboardVisibility,
  handleUpdateLeaderboardVisibility,
} from "./leaderboard";

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
  mockSaveVisibility.mockResolvedValue({ written: true });
});

/** ユーザー名を決める前の認証の結果 */
function withoutUsername() {
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "me" },
    profile: undefined,
  });
}

function postVisibility(body: unknown) {
  return new Request(`${URL_BASE}/visibility`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

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

describe("handleReadLeaderboardVisibility", () => {
  it("本人の設定を返す", async () => {
    mockHidden.mockResolvedValue(true);

    const response = await handleReadLeaderboardVisibility(
      new Request(`${URL_BASE}/visibility`),
    );

    expect(mockHidden).toHaveBeenCalledWith("me");
    expect(await response.json()).toEqual({ hidden: true });
  });

  it("ユーザー名を決める前は読まずに 409 usernameRequired", async () => {
    withoutUsername();

    const response = await handleReadLeaderboardVisibility(
      new Request(`${URL_BASE}/visibility`),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "usernameRequired" });
    expect(mockHidden).not.toHaveBeenCalled();
  });
});

describe("handleUpdateLeaderboardVisibility", () => {
  it("本人の設定として保存する", async () => {
    const response = await handleUpdateLeaderboardVisibility(
      postVisibility({ hidden: true }),
    );

    expect(mockSaveVisibility).toHaveBeenCalledWith("me", true);
    expect(await response.json()).toEqual({ success: true });
  });

  it("本文の形が違えば保存せずに 400", async () => {
    const response = await handleUpdateLeaderboardVisibility(
      postVisibility({ hidden: "yes" }),
    );

    expect(response.status).toBe(400);
    expect(mockSaveVisibility).not.toHaveBeenCalled();
  });

  it("ユーザー名を決める前は保存せずに 409 usernameRequired", async () => {
    withoutUsername();

    const response = await handleUpdateLeaderboardVisibility(
      postVisibility({ hidden: true }),
    );

    expect(response.status).toBe(409);
    expect(mockSaveVisibility).not.toHaveBeenCalled();
  });

  it("認証の後に退会を受け付けていたら 403 deleted", async () => {
    mockSaveVisibility.mockResolvedValue({ written: false });

    const response = await handleUpdateLeaderboardVisibility(
      postVisibility({ hidden: true }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "deleted" });
  });
});
