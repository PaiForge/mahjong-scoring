import { describe, expect, it } from "vitest";

import { mobilePlatformOf } from "./platform";

const URL_BASE = "https://mahjong.example/api/mobile/v1/plan/offers";

function request(query: string, headers: Record<string, string> = {}) {
  return new Request(`${URL_BASE}${query}`, { headers });
}

describe("mobilePlatformOf", () => {
  it("クエリもヘッダも無い要求（出荷済みの iOS 版）は ios", () => {
    expect(mobilePlatformOf(request(""))).toBe("ios");
  });

  it("クエリの platform を読む", () => {
    expect(mobilePlatformOf(request("?platform=android"))).toBe("android");
    expect(mobilePlatformOf(request("?platform=ios"))).toBe("ios");
  });

  it("クエリが無ければ X-App-Platform ヘッダを読む", () => {
    expect(mobilePlatformOf(request("", { "X-App-Platform": "android" }))).toBe(
      "android",
    );
  });

  it("クエリをヘッダより先に読む", () => {
    expect(
      mobilePlatformOf(
        request("?platform=ios", { "X-App-Platform": "android" }),
      ),
    ).toBe("ios");
  });

  it("知らない値は無視し、次の手掛かりか ios に倒す", () => {
    expect(
      mobilePlatformOf(
        request("?platform=web", { "X-App-Platform": "android" }),
      ),
    ).toBe("android");
    expect(
      mobilePlatformOf(
        request("?platform=web", { "X-App-Platform": "windows" }),
      ),
    ).toBe("ios");
  });
});
