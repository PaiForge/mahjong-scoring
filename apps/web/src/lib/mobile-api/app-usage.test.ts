import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockWriteAsAccount, mockAfter } = vi.hoisted(() => ({
  mockWriteAsAccount: vi.fn(),
  mockAfter: vi.fn(),
}));

vi.mock("../users/account-write-lock", () => ({
  writeAsAccount: mockWriteAsAccount,
}));
vi.mock("next/server", () => ({ after: mockAfter }));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));

import { logExternalError } from "../log-error";

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

/** JST の日時（`2026-11-20T23:59` のように書く） */
function jst(local: string): Date {
  return new Date(`${local}:00+09:00`);
}

/** `after()` に渡された処理を走らせる */
async function runScheduled(): Promise<void> {
  for (const [task] of mockAfter.mock.calls as [() => Promise<void>][]) {
    await task();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  resetAppUsageWritesForTest();
  mockWriteAsAccount.mockResolvedValue({ written: true, value: undefined });
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

  it("同じ人の同じ申告は JST の 1 日に 1 回だけ書く", () => {
    expect(claimAppUsageWrite("user-1", report, jst("2026-11-20T00:00"))).toBe(
      true,
    );
    expect(claimAppUsageWrite("user-1", report, jst("2026-11-20T23:59"))).toBe(
      false,
    );
    expect(claimAppUsageWrite("user-1", report, jst("2026-11-21T00:00"))).toBe(
      true,
    );
  });

  it("前日の遅い時刻に書いた人も、翌日の最初の要求で書く（24 時間を待たない）", () => {
    expect(claimAppUsageWrite("user-1", report, jst("2026-11-20T23:00"))).toBe(
      true,
    );
    expect(claimAppUsageWrite("user-1", report, jst("2026-11-21T08:00"))).toBe(
      true,
    );
  });

  it("版か OS が変わったらその日のうちでも書く", () => {
    const day = jst("2026-11-20T10:00");
    expect(claimAppUsageWrite("user-1", report, day)).toBe(true);
    expect(
      claimAppUsageWrite("user-1", { ...report, appVersion: "1.2.0" }, day),
    ).toBe(true);
    expect(
      claimAppUsageWrite(
        "user-1",
        { platform: "android", appVersion: "1.2.0" },
        day,
      ),
    ).toBe(true);
  });

  it("人ごとに数える", () => {
    const day = jst("2026-11-20T10:00");
    expect(claimAppUsageWrite("user-1", report, day)).toBe(true);
    expect(claimAppUsageWrite("user-2", report, day)).toBe(true);
  });

  it("覚える人数の上限を超えたら忘れて数え直す", () => {
    const day = jst("2026-11-20T10:00");
    expect(claimAppUsageWrite("user-0", report, day)).toBe(true);
    for (let i = 1; i < 10_000; i += 1) {
      claimAppUsageWrite(`user-${i}`, report, day);
    }
    // 上限に達した後の 1 人で全員を忘れるので、最初の人がもう一度書ける
    expect(claimAppUsageWrite("user-overflow", report, day)).toBe(true);
    expect(claimAppUsageWrite("user-0", report, day)).toBe(true);
  });
});

describe("recordAppUsage", () => {
  it("応答の後（after）に、退会と直列の書き込みで書く", async () => {
    recordAppUsage(requestWith(IOS), "user-1");

    expect(mockWriteAsAccount).not.toHaveBeenCalled();
    await runScheduled();
    expect(mockWriteAsAccount).toHaveBeenCalledWith(
      "user-1",
      expect.any(Function),
    );
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

  it("書き込みに失敗したら、ログに残して次の要求で書き直す", async () => {
    mockWriteAsAccount.mockRejectedValueOnce(new Error("db down"));
    recordAppUsage(requestWith(IOS), "user-1");
    await runScheduled();

    recordAppUsage(requestWith(IOS), "user-1");

    expect(logExternalError).toHaveBeenCalledTimes(1);
    expect(mockAfter).toHaveBeenCalledTimes(2);
  });

  it("after() が投げても要求を落とさず、次の要求で予約し直す", () => {
    mockAfter.mockImplementationOnce(() => {
      throw new Error("outside a request scope");
    });

    expect(() => recordAppUsage(requestWith(IOS), "user-1")).not.toThrow();
    recordAppUsage(requestWith(IOS), "user-1");

    expect(logExternalError).toHaveBeenCalledTimes(1);
    expect(mockAfter).toHaveBeenCalledTimes(2);
  });
});
