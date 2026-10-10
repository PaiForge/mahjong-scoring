import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getNavigablePreviousPeriod } from "./period";
import { aggregateByDay, formatDate, formatShortDate } from "./stats";
import type { ChallengeAttempt } from "./types";

describe("getNavigablePreviousPeriod", () => {
  it("今週からは先週へ遷移できる", () => {
    expect(getNavigablePreviousPeriod("thisWeek")).toBe("lastWeek");
  });

  it("今月からは先月へ遷移できる", () => {
    expect(getNavigablePreviousPeriod("thisMonth")).toBe("lastMonth");
  });

  // 先週・先月のさらに前は期間選択に無いため、凡例をクリックしても遷移しない
  it("先週からは遷移しない", () => {
    expect(getNavigablePreviousPeriod("lastWeek")).toBeUndefined();
  });

  it("先月からは遷移しない", () => {
    expect(getNavigablePreviousPeriod("lastMonth")).toBeUndefined();
  });
});

function attempt(createdAt: string, score: number): ChallengeAttempt {
  return {
    id: createdAt,
    menuType: "jantou_fu",
    variant: "default",
    score,
    incorrectAnswers: 0,
    createdAt: new Date(createdAt),
  };
}

/**
 * 日付の表示と日別の集約は、サーバー（UTC）でもブラウザ（JST）でも
 * JST の日付を使うこと。
 */
describe.each(["UTC", "Asia/Tokyo", "America/Los_Angeles"])(
  "実行環境の TZ が %s のとき",
  (tz) => {
    beforeAll(() => {
      vi.stubEnv("TZ", tz);
    });

    afterAll(() => {
      vi.unstubAllEnvs();
    });

    // 2026-08-17 01:30 JST = 2026-08-16 16:30 UTC
    const EARLY_JST = new Date("2026-08-16T16:30:00Z");

    it("formatDate は JST の日時を出す", () => {
      expect(formatDate(EARLY_JST)).toBe("2026/08/17 01:30");
    });

    it("formatShortDate は JST の月日を出す", () => {
      expect(formatShortDate(EARLY_JST)).toBe("8月17日");
    });

    it("aggregateByDay は JST の日付でまとめる", () => {
      const daily = aggregateByDay([
        // 2026-08-16 23:00 JST
        attempt("2026-08-16T14:00:00Z", 10),
        // 2026-08-17 01:30 JST（UTC ではまだ 8/16）
        attempt("2026-08-16T16:30:00Z", 20),
        // 2026-08-17 09:00 JST
        attempt("2026-08-17T00:00:00Z", 30),
      ]);

      expect(daily).toEqual([
        { dateKey: "2026-08-16", date: "8月16日", avgScore: 10 },
        { dateKey: "2026-08-17", date: "8月17日", avgScore: 25 },
      ]);
    });
  },
);
