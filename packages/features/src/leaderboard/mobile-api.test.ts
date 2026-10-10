import { describe, expect, it } from "vitest";

import {
  mobileLeaderboardApiUrl,
  mobileLeaderboardRanksApiUrl,
  parseMobileLeaderboardRanksResponse,
  parseMobileLeaderboardResponse,
} from "./mobile-api";

describe("mobileLeaderboardRanksApiUrl", () => {
  it("期間をクエリに載せる", () => {
    expect(mobileLeaderboardRanksApiUrl("monthly")).toBe(
      "/api/mobile/v1/leaderboard/ranks?period=monthly",
    );
  });
});

describe("mobileLeaderboardApiUrl", () => {
  it("web の詳細ページと同じ形のパスに土俵とページを載せる", () => {
    expect(
      mobileLeaderboardApiUrl(
        "all-time",
        { menuType: "yaku_han", variant: "kuisagari" },
        2,
      ),
    ).toBe(
      "/api/mobile/v1/leaderboard/all-time/yaku-han?variant=kuisagari&page=2",
    );
  });
});

describe("parseMobileLeaderboardRanksResponse", () => {
  it("アプリが知らない練習の順位を落とす", () => {
    expect(
      parseMobileLeaderboardRanksResponse({
        ranks: [
          { menuType: "jantou_fu", variant: "default", rank: 3 },
          { menuType: "future_practice", variant: "default", rank: 1 },
        ],
        viewerHidden: false,
      }),
    ).toEqual({
      ranks: [{ menuType: "jantou_fu", variant: "default", rank: 3 }],
      viewerHidden: false,
    });
  });

  it("形が違えば undefined", () => {
    expect(parseMobileLeaderboardRanksResponse({ ranks: [] })).toBeUndefined();
  });
});

describe("parseMobileLeaderboardResponse", () => {
  const row = {
    rank: 1,
    username: "bob",
    score: 20,
    incorrectAnswers: 0,
    timeTaken: 60,
    isViewer: false,
  };

  it("表示名・アバター・閲覧者の行の無い応答も読む", () => {
    expect(
      parseMobileLeaderboardResponse({
        rows: [row],
        page: 1,
        totalPages: 1,
        totalCount: 1,
        viewerHidden: false,
      })?.rows,
    ).toEqual([row]);
  });

  it("行に isViewer が無ければ undefined", () => {
    const { isViewer: _, ...withoutViewer } = row;
    expect(
      parseMobileLeaderboardResponse({
        rows: [withoutViewer],
        page: 1,
        totalPages: 1,
        totalCount: 1,
        viewerHidden: false,
      }),
    ).toBeUndefined();
  });
});
