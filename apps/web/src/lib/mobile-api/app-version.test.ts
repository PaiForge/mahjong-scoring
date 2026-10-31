import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockClientIp } = vi.hoisted(() => ({ mockClientIp: vi.fn() }));

vi.mock("../client-ip", () => ({ getClientIp: mockClientIp }));

import { _resetStore } from "../rate-limit-ip";
import { handleReadAppVersion } from "./app-version";

function request(query: string): Request {
  return new Request(`http://localhost/api/mobile/v1/app-version${query}`);
}

beforeEach(() => {
  _resetStore();
  mockClientIp.mockResolvedValue("203.0.113.1");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("handleReadAppVersion", () => {
  it("OS ごとの最低バージョンを返す", async () => {
    vi.stubEnv("MOBILE_MINIMUM_APP_VERSION_IOS", "1.2.0");
    vi.stubEnv("MOBILE_MINIMUM_APP_VERSION_ANDROID", "1.0.3");

    const ios = await handleReadAppVersion(request("?platform=ios"));
    const android = await handleReadAppVersion(request("?platform=android"));

    expect(await ios.json()).toEqual({ minimumVersion: "1.2.0" });
    expect(await android.json()).toEqual({ minimumVersion: "1.0.3" });
  });

  it("未設定・空・形の違う値なら最低バージョンを返さない（止めない）", async () => {
    for (const value of [undefined, "", "latest"]) {
      vi.stubEnv("MOBILE_MINIMUM_APP_VERSION_IOS", value);

      const response = await handleReadAppVersion(request("?platform=ios"));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({});
    }
  });

  it("OS の指定が無い・知らない値なら 400", async () => {
    for (const query of ["", "?platform=web"]) {
      const response = await handleReadAppVersion(request(query));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "invalidRequest" });
    }
  });

  it("同じ IP からの回数の上限を超えたら 429", async () => {
    for (let i = 0; i < 120; i += 1)
      await handleReadAppVersion(request("?platform=ios"));

    const response = await handleReadAppVersion(request("?platform=ios"));

    expect(response.status).toBe(429);
  });
});
