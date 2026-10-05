// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockNotify } = vi.hoisted(() => ({ mockNotify: vi.fn() }));

vi.mock("@/lib/notifications/plan-expiry", () => ({
  notifyExpiredPlans: mockNotify,
}));

import { GET } from "./route";

function request(authorization?: string) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("http://localhost/api/cron/notify-plan-expiry", {
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.stubEnv("CRON_SECRET", "s3cret");
  mockNotify.mockResolvedValue({
    expired: 2,
    stillActive: 1,
    candidates: 1,
    notified: 1,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/cron/notify-plan-expiry", () => {
  it("秘密が合わなければ 401 で、バッチを走らせない", async () => {
    const res = await GET(request("Bearer wrong!"));
    expect(res.status).toBe(401);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("秘密が合えばバッチを走らせ、結果を返す", async () => {
    const res = await GET(request("Bearer s3cret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      expired: 2,
      stillActive: 1,
      candidates: 1,
      notified: 1,
    });
  });

  it("バッチが失敗したら 500 でログを残す", async () => {
    mockNotify.mockRejectedValue(new Error("db down"));
    const res = await GET(request("Bearer s3cret"));
    expect(res.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[cron/notify-plan-expiry]"),
      "db down",
    );
  });
});
