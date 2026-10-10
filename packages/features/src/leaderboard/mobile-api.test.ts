import { describe, expect, it } from "vitest";

import {
  mobileLeaderboardRanksApiUrl,
  parseMobileLeaderboardRanksResponse,
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
