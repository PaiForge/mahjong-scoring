import { describe, expect, it } from "vitest";

import {
  isMobileAvatarErrorCode,
  isMobileProfileErrorCode,
  parseMobileAvatarResponse,
  parseMobileProfileResponse,
} from "./mobile-api";

const PROFILE = {
  username: "bob",
  displayName: "",
  bio: "",
  xUsername: "",
  instagramUsername: "",
  youtubeHandle: "",
};

describe("parseMobileProfileResponse", () => {
  it("アバターが無くても読む", () => {
    expect(parseMobileProfileResponse(PROFILE)).toEqual(PROFILE);
  });

  it("アバターの URL を残す", () => {
    expect(
      parseMobileProfileResponse({
        ...PROFILE,
        avatarUrl: "https://example.test/a.webp",
      }),
    ).toEqual({ ...PROFILE, avatarUrl: "https://example.test/a.webp" });
  });

  it("編集する欄が欠けていたら読まない", () => {
    const { bio: _bio, ...rest } = PROFILE;
    expect(parseMobileProfileResponse(rest)).toBeUndefined();
  });
});

describe("isMobileProfileErrorCode", () => {
  it("検証の誤りだけを理由と認める", () => {
    expect(isMobileProfileErrorCode("bioTooLong")).toBe(true);
    expect(isMobileProfileErrorCode("updateFailed")).toBe(false);
    expect(isMobileProfileErrorCode(undefined)).toBe(false);
  });
});

describe("parseMobileAvatarResponse", () => {
  it("URL を読み、無ければ読まない", () => {
    expect(
      parseMobileAvatarResponse({ avatarUrl: "https://example.test/a.webp" }),
    ).toEqual({ avatarUrl: "https://example.test/a.webp" });
    expect(parseMobileAvatarResponse({ success: true })).toBeUndefined();
  });
});

describe("isMobileAvatarErrorCode", () => {
  it("画像の理由だけを認める", () => {
    expect(isMobileAvatarErrorCode("tooLarge")).toBe(true);
    expect(isMobileAvatarErrorCode("uploadFailed")).toBe(false);
  });
});
