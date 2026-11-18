import { describe, expect, it } from "vitest";

import {
  isMobileMypageErrorCode,
  MOBILE_MYPAGE_API_PATH,
  MOBILE_MYPAGE_ERROR_CODES,
  parseMobileMypageResponse,
} from "./mobile-api";

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

  it("未読の通知の件数を読む", () => {
    expect(
      parseMobileMypageResponse({
        profile: { username: "bob" },
        recentActivity: [],
        unreadNotificationCount: 2,
      })?.unreadNotificationCount,
    ).toBe(2);
  });

  it("形が違えば undefined", () => {
    expect(parseMobileMypageResponse({ profile: {} })).toBe(undefined);
  });
});

describe("MOBILE_MYPAGE_API_PATH", () => {
  // 配布済みのアプリは強制的に更新できないので、パスは版付きの接頭辞の下に置く
  it("版付きの接頭辞 /api/mobile/v1/ の下にある", () => {
    expect(MOBILE_MYPAGE_API_PATH.startsWith("/api/mobile/v1/")).toBe(true);
    expect(MOBILE_MYPAGE_API_PATH.length).toBeGreaterThan(
      "/api/mobile/v1/".length,
    );
  });
});

describe("isMobileMypageErrorCode", () => {
  it("一覧は空でなく、空文字も重複も含まない", () => {
    expect(MOBILE_MYPAGE_ERROR_CODES.length).toBeGreaterThan(0);
    for (const code of MOBILE_MYPAGE_ERROR_CODES) expect(code).not.toBe("");
    expect(new Set(MOBILE_MYPAGE_ERROR_CODES).size).toBe(
      MOBILE_MYPAGE_ERROR_CODES.length,
    );
  });

  it("一覧の理由をすべて認める", () => {
    for (const code of MOBILE_MYPAGE_ERROR_CODES) {
      expect(isMobileMypageErrorCode(code)).toBe(true);
    }
  });

  it("一覧に無い文字列・文字列でない値は認めない", () => {
    expect(isMobileMypageErrorCode("unauthorized")).toBe(false);
    expect(isMobileMypageErrorCode("")).toBe(false);
    expect(isMobileMypageErrorCode(undefined)).toBe(false);
    expect(isMobileMypageErrorCode(0)).toBe(false);
  });
});
