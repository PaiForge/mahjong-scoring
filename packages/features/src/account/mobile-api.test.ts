import { describe, expect, it } from "vitest";

import { MOBILE_APPLE_TOKEN_API_PATH } from "./apple";
import {
  isMobileApiErrorCode,
  isMobileDeleteAccountErrorCode,
  isMobileUsernameErrorCode,
  MOBILE_API_ERROR_CODES,
  MOBILE_BAN_API_PATH,
  MOBILE_DELETE_ACCOUNT_API_PATH,
  MOBILE_DELETE_ACCOUNT_ERROR_CODES,
  MOBILE_ME_API_PATH,
  MOBILE_USERNAME_API_PATH,
  MOBILE_USERNAME_ERROR_CODES,
  parseMobileBanResponse,
  parseMobileMeResponse,
} from "./mobile-api";

describe("アカウントのアプリ向け API のパス", () => {
  const paths = [
    MOBILE_ME_API_PATH,
    MOBILE_BAN_API_PATH,
    MOBILE_USERNAME_API_PATH,
    MOBILE_DELETE_ACCOUNT_API_PATH,
    MOBILE_APPLE_TOKEN_API_PATH,
  ];

  // 配布済みのアプリは強制的に更新できないので、どのパスも版付きの接頭辞の下に置く
  it.each(paths)("%s は版付きの接頭辞 /api/mobile/v1/ の下にある", (path) => {
    expect(path.startsWith("/api/mobile/v1/")).toBe(true);
    expect(path.length).toBeGreaterThan("/api/mobile/v1/".length);
  });

  it("API ごとにパスが重ならない", () => {
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("parseMobileMeResponse", () => {
  it("プロフィールとアバターの URL を読む", () => {
    const body = {
      userId: "u1",
      profile: { username: "alice", avatarUrl: "https://example.com/a.png" },
    };
    expect(parseMobileMeResponse(body)).toEqual(body);
  });

  it("アバターの無い旧い形のプロフィールも読む", () => {
    expect(
      parseMobileMeResponse({ userId: "u1", profile: { username: "alice" } }),
    ).toEqual({ userId: "u1", profile: { username: "alice" } });
  });

  it("ユーザー名を決める前（profile が null）も読む", () => {
    expect(parseMobileMeResponse({ userId: "u1", profile: null })).toEqual({
      userId: "u1",
      profile: null,
    });
  });

  it.each([
    ["userId が無い", { profile: null }],
    ["profile が無い", { userId: "u1" }],
    ["ユーザー名が文字列でない", { userId: "u1", profile: { username: 1 } }],
    ["本文が無い", undefined],
  ])("%s応答は undefined", (_label, body) => {
    expect(parseMobileMeResponse(body)).toBeUndefined();
  });
});

describe("parseMobileBanResponse", () => {
  it("BAN が解けていれば banned: false だけを読む", () => {
    expect(parseMobileBanResponse({ banned: false })).toEqual({
      banned: false,
    });
  });

  it("BAN の理由を読む。理由が無ければ null", () => {
    expect(parseMobileBanResponse({ banned: true, reason: "spam" })).toEqual({
      banned: true,
      reason: "spam",
    });
    expect(parseMobileBanResponse({ banned: true, reason: null })).toEqual({
      banned: true,
      reason: null,
    });
  });

  it.each([
    ["BAN 中なのに reason が無い", { banned: true }],
    ["banned が真偽値でない", { banned: "true", reason: null }],
    ["banned が無い", { reason: null }],
    ["本文が無い", null],
  ])("%s応答は undefined", (_label, body) => {
    expect(parseMobileBanResponse(body)).toBeUndefined();
  });
});

/** 理由の一覧の不変条件（空でない・空文字を含まない・重複しない） */
function expectWellFormedCodes(codes: readonly string[]): void {
  expect(codes.length).toBeGreaterThan(0);
  for (const code of codes) expect(code).not.toBe("");
  expect(new Set(codes).size).toBe(codes.length);
}

describe.each([
  ["共通のエラーの理由", MOBILE_API_ERROR_CODES, isMobileApiErrorCode],
  [
    "ユーザー名登録で弾く理由",
    MOBILE_USERNAME_ERROR_CODES,
    isMobileUsernameErrorCode,
  ],
  [
    "退会の API 固有の理由",
    MOBILE_DELETE_ACCOUNT_ERROR_CODES,
    isMobileDeleteAccountErrorCode,
  ],
] as const)("%s", (_label, codes, isCode) => {
  it("一覧は空でなく、空文字も重複も含まない", () => {
    expectWellFormedCodes(codes);
  });

  it("一覧の理由をすべて認める", () => {
    for (const code of codes) expect(isCode(code)).toBe(true);
  });

  it("一覧に無い文字列・文字列でない値は認めない", () => {
    expect(isCode("unknownReason")).toBe(false);
    expect(isCode("")).toBe(false);
    expect(isCode(undefined)).toBe(false);
    expect(isCode(null)).toBe(false);
    expect(isCode(0)).toBe(false);
  });
});
