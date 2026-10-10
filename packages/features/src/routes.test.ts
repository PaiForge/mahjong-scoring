import { describe, expect, it } from "vitest";

import {
  leaderboardHref,
  myRecordHref,
  practiceHref,
  publicProfileHref,
  rankHref,
} from "./routes";

describe("practiceHref", () => {
  it("slug から練習ページのパスを作る", () => {
    expect(practiceHref("jantou-fu")).toBe("/practice/jantou-fu");
  });

  it("バリアントを渡すとクエリに載せる", () => {
    expect(practiceHref("score-table", "all")).toBe(
      "/practice/score-table?variant=all",
    );
  });

  it("バリアントを持たない練習にはクエリを付けない", () => {
    expect(practiceHref("jantou-fu", "default")).toBe("/practice/jantou-fu");
  });
});

describe("rankHref", () => {
  it("段級位の詳細の親パスの下に slug を置く", () => {
    expect(rankHref("kyu-5")).toBe("/dojo/ranks/kyu-5");
  });
});

describe("myRecordHref", () => {
  it("土俵を menu と variant のクエリで運ぶ", () => {
    expect(myRecordHref({ menuType: "yaku_han", variant: "kuisagari" })).toBe(
      "/mypage/challenges?menu=yaku_han&variant=kuisagari",
    );
  });
});

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

describe("publicProfileHref", () => {
  it("ユーザー名を /u/ の下に置く", () => {
    expect(publicProfileHref("bob")).toBe("/u/bob");
  });
});
