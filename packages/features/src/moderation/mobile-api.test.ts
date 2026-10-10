import { describe, expect, it } from "vitest";

import {
  isMobileModerationErrorCode,
  mobileBlockApiPath,
  mobileReportApiPath,
  mobileUnblockApiPath,
  parseMobileBlocksResponse,
} from "./mobile-api";

describe("ブロック・通報の API のパス", () => {
  it("ユーザー名を 1 つのパスの区切りとして埋め込む", () => {
    expect(mobileBlockApiPath("a/b")).toBe("/api/mobile/v1/users/a%2Fb/block");
    expect(mobileUnblockApiPath("bob")).toBe(
      "/api/mobile/v1/users/bob/unblock",
    );
    expect(mobileReportApiPath("bob")).toBe("/api/mobile/v1/users/bob/report");
  });
});

describe("isMobileModerationErrorCode", () => {
  it("通報の入力の誤りも含む", () => {
    expect(isMobileModerationErrorCode("detailRequired")).toBe(true);
    expect(isMobileModerationErrorCode("self")).toBe(true);
    expect(isMobileModerationErrorCode("unauthorized")).toBe(false);
  });
});

describe("parseMobileBlocksResponse", () => {
  it("表示名・アバターの無い行も読む", () => {
    expect(parseMobileBlocksResponse({ items: [{ username: "bob" }] })).toEqual(
      { items: [{ username: "bob" }] },
    );
  });

  it("形が違えば undefined", () => {
    expect(parseMobileBlocksResponse({ items: [{}] })).toBeUndefined();
  });
});
