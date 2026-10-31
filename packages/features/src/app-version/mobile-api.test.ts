import { describe, expect, it } from "vitest";

import {
  isMobileAppPlatform,
  mobileAppVersionApiUrl,
  parseMobileAppVersionResponse,
} from "./mobile-api";

describe("最低バージョンの API の契約", () => {
  it("OS をクエリに載せる", () => {
    expect(mobileAppVersionApiUrl("ios")).toBe(
      "/api/mobile/v1/app-version?platform=ios",
    );
  });

  it("OS の値を見分ける", () => {
    expect(isMobileAppPlatform("ios")).toBe(true);
    expect(isMobileAppPlatform("android")).toBe(true);
    expect(isMobileAppPlatform("web")).toBe(false);
    expect(isMobileAppPlatform(undefined)).toBe(false);
  });

  it("最低バージョンは省略できる", () => {
    expect(parseMobileAppVersionResponse({})).toEqual({});
    expect(parseMobileAppVersionResponse({ minimumVersion: "1.1.0" })).toEqual({
      minimumVersion: "1.1.0",
    });
  });

  it("形の違う応答は読まない", () => {
    expect(
      parseMobileAppVersionResponse({ minimumVersion: 1 }),
    ).toBeUndefined();
    expect(parseMobileAppVersionResponse(null)).toBeUndefined();
  });
});
