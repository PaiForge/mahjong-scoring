import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockProfile, mockHeatmap, mockRanks } = vi.hoisted(
  () => ({
    mockAuthorize: vi.fn(),
    mockProfile: vi.fn(),
    mockHeatmap: vi.fn(),
    mockRanks: vi.fn(),
  }),
);

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../db/queries", () => ({ getProfileCardByUserId: mockProfile }));
vi.mock("../db/get-exp-heatmap-data", () => ({
  getExpHeatmapData: mockHeatmap,
}));
vi.mock("../db/rank-queries", () => ({ getUserRankSlugs: mockRanks }));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { handleReadMypage } from "./mypage";

const request = () => new Request("https://example.test");

beforeEach(() => {
  vi.clearAllMocks();
  // JST の 2026-10-10 09:00（UTC では前日をまたがない時刻）
  vi.useFakeTimers({ now: new Date("2026-10-10T09:00:00+09:00") });
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "user-1" },
    profile: { username: "bob" },
  });
  mockProfile.mockResolvedValue({
    username: "bob",
    displayName: null,
    avatarUrl: null,
  });
  mockHeatmap.mockResolvedValue({ daily: {}, dailyByModule: {} });
  mockRanks.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("handleReadMypage", () => {
  it("JST の今日で終わる直近 7 日を古い順に、活動の無い日も 0 で返す", async () => {
    mockHeatmap.mockResolvedValue({
      daily: { "2026-10-10": 30, "2026-10-04": 5, "2026-10-03": 99 },
      dailyByModule: {
        "2026-10-10": { jantou_fu: 10, mentsu_fu: 20 },
        "2026-10-04": { jantou_fu: 5 },
      },
    });

    const body = await (await handleReadMypage(request())).json();

    expect(mockHeatmap).toHaveBeenCalledWith("user-1", expect.any(Date));
    expect(body.recentActivity).toEqual([
      { date: "2026-10-04", exp: 5, expByMenuType: { jantou_fu: 5 } },
      { date: "2026-10-05", exp: 0, expByMenuType: {} },
      { date: "2026-10-06", exp: 0, expByMenuType: {} },
      { date: "2026-10-07", exp: 0, expByMenuType: {} },
      { date: "2026-10-08", exp: 0, expByMenuType: {} },
      { date: "2026-10-09", exp: 0, expByMenuType: {} },
      {
        date: "2026-10-10",
        exp: 30,
        expByMenuType: { jantou_fu: 10, mentsu_fu: 20 },
      },
    ]);
  });

  it("未設定の表示名・アバターと無級は項目ごと省く", async () => {
    const body = await (await handleReadMypage(request())).json();

    expect(body.profile).toEqual({ username: "bob" });
    expect("rankSlug" in body).toBe(false);
  });

  it("表示名・アバターと最上位の段級位を返す", async () => {
    mockProfile.mockResolvedValue({
      username: "bob",
      displayName: "ボブ",
      avatarUrl: "https://example.test/a.webp",
    });
    mockRanks.mockResolvedValue(["kyu-4", "kyu-5"]);

    const body = await (await handleReadMypage(request())).json();

    expect(body.profile).toEqual({
      username: "bob",
      displayName: "ボブ",
      avatarUrl: "https://example.test/a.webp",
    });
    expect(body.rankSlug).toBe("kyu-4");
  });

  it("ユーザー名を決める前は読まずに 409 usernameRequired", async () => {
    mockAuthorize.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      profile: undefined,
    });

    const response = await handleReadMypage(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "usernameRequired" });
    expect(mockHeatmap).not.toHaveBeenCalled();
  });

  it("読み取りに失敗したら 500 serverError", async () => {
    mockHeatmap.mockRejectedValue(new Error("db down"));

    const response = await handleReadMypage(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});
