import { describe, expect, it } from "vitest";

import { parseMobileMypageResponse } from "./mobile-api";

describe("parseMobileMypageResponse", () => {
  it("省略可能な項目が無くても読む", () => {
    expect(
      parseMobileMypageResponse({
        profile: { username: "alice" },
        recentActivity: [],
      }),
    ).toEqual({ profile: { username: "alice" }, recentActivity: [] });
  });

  it("知らない練習種別の経験値は残し、知らない段級位は無級にする", () => {
    expect(
      parseMobileMypageResponse({
        profile: { username: "bob", displayName: "ボブ" },
        rankSlug: "future-rank",
        recentActivity: [
          {
            date: "2026-10-10",
            exp: 30,
            expByMenuType: { jantou_fu: 10, future_practice: 20 },
          },
        ],
      }),
    ).toEqual({
      profile: { username: "bob", displayName: "ボブ" },
      recentActivity: [
        {
          date: "2026-10-10",
          exp: 30,
          expByMenuType: { jantou_fu: 10, future_practice: 20 },
        },
      ],
    });
  });

  it("知っている段級位は残す", () => {
    expect(
      parseMobileMypageResponse({
        profile: { username: "bob" },
        rankSlug: "kyu-5",
        recentActivity: [],
      })?.rankSlug,
    ).toBe("kyu-5");
  });

  it("形が違えば undefined", () => {
    expect(parseMobileMypageResponse({ profile: {} })).toBe(undefined);
  });
});
