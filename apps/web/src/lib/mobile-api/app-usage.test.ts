import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockExecute, mockAfter } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockAfter: vi.fn(),
}));

vi.mock("../db", () => ({ db: { execute: mockExecute } }));
vi.mock("next/server", () => ({ after: mockAfter }));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import {
  claimAppUsageWrite,
  readAppUsageReport,
  recordAppUsage,
  resetAppUsageWritesForTest,
} from "./app-usage";

function requestWith(headers: Record<string, string>): Request {
  return new Request("https://example.test/api/mobile/v1/me", { headers });
}

const IOS = { "X-App-Platform": "ios", "X-App-Version": "1.1.0" };
const DAY_MS = 24 * 60 * 60 * 1000;

/** `after()` に渡された処理を走らせる */
async function runScheduled(): Promise<void> {
  for (const [task] of mockAfter.mock.calls as [() => Promise<void>][]) {
    await task();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  resetAppUsageWritesForTest();
  mockExecute.mockResolvedValue(undefined);
});

describe("readAppUsageReport", () => {
  it("OS と版のヘッダを読む", () => {
    expect(readAppUsageReport(requestWith(IOS))).toEqual({
      platform: "ios",
      appVersion: "1.1.0",
    });
  });

  it("OS のヘッダが無い要求（画面確認用の web 版）は ios に倒さず記録しない", () => {
    expect(
      readAppUsageReport(requestWith({ "X-App-Version": "1.1.0" })),
    ).toBeUndefined();
    expect(
      readAppUsageReport(requestWith({ "X-App-Platform": "web" })),
    ).toBeUndefined();
  });

  it("読めない形の版は捨て、OS だけを記録する", () => {
    expect(
      readAppUsageReport(
        requestWith({
          "X-App-Platform": "android",
          "X-App-Version": "x".repeat(100),
        }),
      ),
    ).toEqual({ platform: "android", appVersion: undefined });
  });
});

describe("claimAppUsageWrite", () => {
  const report = { platform: "ios", appVersion: "1.1.0" } as const;

  it("同じ人の同じ申告は 1 日に 1 回だけ書く", () => {
    expect(claimAppUsageWrite("user-1", report, 0)).toBe(true);
    expect(claimAppUsageWrite("user-1", report, DAY_MS - 1)).toBe(false);
    expect(claimAppUsageWrite("user-1", report, DAY_MS)).toBe(true);
  });

  it("版か OS が変わったら 1 日を待たずに書く", () => {
    expect(claimAppUsageWrite("user-1", report, 0)).toBe(true);
    expect(
      claimAppUsageWrite("user-1", { ...report, appVersion: "1.2.0" }, 1),
    ).toBe(true);
    expect(
      claimAppUsageWrite(
        "user-1",
        { platform: "android", appVersion: "1.2.0" },
        2,
      ),
    ).toBe(true);
  });

  it("人ごとに数える", () => {
    expect(claimAppUsageWrite("user-1", report, 0)).toBe(true);
    expect(claimAppUsageWrite("user-2", report, 0)).toBe(true);
  });
});

describe("recordAppUsage", () => {
  it("応答の後（after）に書き込む", async () => {
    recordAppUsage(requestWith(IOS), "user-1");

    expect(mockExecute).not.toHaveBeenCalled();
    await runScheduled();
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it("OS のヘッダが無ければ何もしない", () => {
    recordAppUsage(requestWith({}), "user-1");

    expect(mockAfter).not.toHaveBeenCalled();
  });

  it("同じ申告が続いても、書き込みの予約は 1 回だけ", () => {
    recordAppUsage(requestWith(IOS), "user-1");
    recordAppUsage(requestWith(IOS), "user-1");

    expect(mockAfter).toHaveBeenCalledTimes(1);
  });

  it("書き込みに失敗したら、次の要求で書き直す", async () => {
    mockExecute.mockRejectedValueOnce(new Error("db down"));
    recordAppUsage(requestWith(IOS), "user-1");
    await runScheduled();

    recordAppUsage(requestWith(IOS), "user-1");

    expect(mockAfter).toHaveBeenCalledTimes(2);
  });
});

describe("recordAppUsage（要求の外）", () => {
  it("after() が投げても要求を落とさない", () => {
    mockAfter.mockImplementationOnce(() => {
      throw new Error("outside a request scope");
    });

    expect(() => recordAppUsage(requestWith(IOS), "user-1")).not.toThrow();
  });
});
