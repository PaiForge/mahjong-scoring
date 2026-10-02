import { afterEach, describe, expect, it, vi } from "vitest";

import { isAuthorizedCronRequest } from "../cron-auth";

function request(authorization?: string) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("http://localhost/api/cron/x", { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isAuthorizedCronRequest", () => {
  it("CRON_SECRET が未設定なら、どんなヘッダでも拒否する", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isAuthorizedCronRequest(request("Bearer "))).toBe(false);
    expect(isAuthorizedCronRequest(request())).toBe(false);
  });

  it("Bearer <CRON_SECRET> と一致すれば通す", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isAuthorizedCronRequest(request("Bearer s3cret"))).toBe(true);
  });

  it.each([
    ["ヘッダ無し", undefined],
    ["値が違う", "Bearer other!"],
    ["長さが違う", "Bearer s3cret-long"],
    ["Bearer が無い", "s3cret"],
  ])("%s なら拒否する", (_label, header) => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isAuthorizedCronRequest(request(header))).toBe(false);
  });
});
