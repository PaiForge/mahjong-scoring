import { describe, expect, it } from "vitest";

import { leaderboardHref } from "../leaderboard-href";

describe("leaderboardHref", () => {
  it("バリアントを持たない練習はクエリを付けない", () => {
    expect(
      leaderboardHref("all-time", {
        menuType: "jantou_fu",
        variant: "default",
      }),
    ).toBe("/leaderboard/all-time/jantou-fu");
    expect(
      leaderboardHref("monthly", { menuType: "yaku", variant: "default" }),
    ).toBe("/leaderboard/monthly/yaku");
  });

  it("バリアントを持つ練習は ?variant= で土俵を指す", () => {
    expect(
      leaderboardHref("all-time", {
        menuType: "yaku_han",
        variant: "kuisagari",
      }),
    ).toBe("/leaderboard/all-time/yaku-han?variant=kuisagari");
  });
});
