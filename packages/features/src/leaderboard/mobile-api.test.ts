import { describe, expect, it } from "vitest";

import {
  MOBILE_LEADERBOARD_ERROR_CODES,
  MOBILE_LEADERBOARD_VISIBILITY_API_PATH,
  mobileLeaderboardRanksApiUrl,
  parseMobileLeaderboardRanksResponse,
  parseMobileLeaderboardVisibility,
} from "./mobile-api";

describe("mobileLeaderboardRanksApiUrl", () => {
  it("期間をクエリに載せる", () => {
    expect(mobileLeaderboardRanksApiUrl("monthly")).toBe(
      "/api/mobile/v1/leaderboard/ranks?period=monthly",
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

describe("parseMobileLeaderboardVisibility", () => {
  it("設定を読む", () => {
    expect(parseMobileLeaderboardVisibility({ hidden: true })).toEqual({
      hidden: true,
    });
  });

  it("形が違えば undefined", () => {
    expect(parseMobileLeaderboardVisibility({ hidden: "yes" })).toBeUndefined();
  });
});

describe("MOBILE_LEADERBOARD_VISIBILITY_API_PATH", () => {
  it("ランキングへの表示設定のパス", () => {
    expect(MOBILE_LEADERBOARD_VISIBILITY_API_PATH).toBe(
      "/api/mobile/v1/leaderboard/visibility",
    );
  });
});

describe("MOBILE_LEADERBOARD_ERROR_CODES", () => {
  it("失敗の理由は 1 つ以上あり、空の名前も重複も無い", () => {
    expect(MOBILE_LEADERBOARD_ERROR_CODES.length).toBeGreaterThan(0);
    expect(new Set(MOBILE_LEADERBOARD_ERROR_CODES).size).toBe(
      MOBILE_LEADERBOARD_ERROR_CODES.length,
    );
    for (const code of MOBILE_LEADERBOARD_ERROR_CODES) {
      expect(code).not.toBe("");
    }
  });
});
