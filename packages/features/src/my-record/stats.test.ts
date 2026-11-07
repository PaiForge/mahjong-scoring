import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getNavigablePreviousPeriod } from "./period";
import {
  aggregateByDay,
  buildChartData,
  computeStatsComparison,
  formatAvgScore,
  formatDate,
  formatShortDate,
  toAttemptRows,
} from "./stats";
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

    it("英語の formatDate は JST の日時を en-US の書式で出す", () => {
      expect(formatDate(EARLY_JST, "en").replace(/\s/gu, " ")).toBe(
        "Aug 17, 2026, 1:30 AM",
      );
    });

    it("英語の formatShortDate は JST の月日を en-US の書式で出す", () => {
      expect(formatShortDate(EARLY_JST, "en")).toBe("Aug 17");
    });

    it("英語の aggregateByDay も JST の日付でまとめ、ラベルだけ英語にする", () => {
      const daily = aggregateByDay(
        [
          attempt("2026-08-16T14:00:00Z", 10),
          attempt("2026-08-16T16:30:00Z", 20),
        ],
        "en",
      );

      expect(daily).toEqual([
        { dateKey: "2026-08-16", date: "Aug 16", avgScore: 10 },
        { dateKey: "2026-08-17", date: "Aug 17", avgScore: 20 },
      ]);
    });
  },
);

describe("表示の言語を省いたとき（モバイル・既存の呼び出し）", () => {
  const attempts = [attempt("2026-08-16T16:30:00Z", 20)];

  it("formatDate・formatShortDate は日本語の出力と同じ", () => {
    const date = new Date("2026-08-16T16:30:00Z");
    expect(formatDate(date)).toBe(formatDate(date, "ja"));
    expect(formatShortDate(date)).toBe(formatShortDate(date, "ja"));
    expect(formatDate(undefined, "en")).toBe("-");
    expect(formatShortDate(undefined, "en")).toBe("-");
  });

  it("toAttemptRows・buildChartData は日本語のラベルを出す", () => {
    expect(toAttemptRows(attempts)[0]?.date).toBe("2026/08/17 01:30");
    expect(buildChartData(attempts, [])[0]?.date).toBe("8月17日");
  });

  it("toAttemptRows・buildChartData は英語を渡すと英語のラベルを出す", () => {
    expect(toAttemptRows(attempts, 5, "en")[0]?.date.replace(/\s/gu, " ")).toBe(
      "Aug 17, 2026, 1:30 AM",
    );
    expect(buildChartData(attempts, [], "en")[0]?.date).toBe("Aug 17");
  });
});

describe("computeStatsComparison", () => {
  it("今の期間の統計と前期間からの差を出す", () => {
    const comparison = computeStatsComparison(
      [
        attempt("2026-08-17T00:00:00Z", 10),
        attempt("2026-08-18T00:00:00Z", 20),
      ],
      [attempt("2026-08-10T00:00:00Z", 12)],
    );

    expect(comparison.current.bestScore).toBe(20);
    expect(comparison.bestChange).toBe(8);
    expect(comparison.avgChange).toBe(3);
  });

  it("前の期間に記録が無ければ増減は undefined", () => {
    const comparison = computeStatsComparison(
      [attempt("2026-08-17T00:00:00Z", 10)],
      [],
    );

    expect(comparison.bestChange).toBeUndefined();
    expect(comparison.avgChange).toBeUndefined();
  });
});

describe("formatAvgScore", () => {
  it("小数 1 桁で出し、値が無ければ - にする", () => {
    expect(formatAvgScore(12.34)).toBe("12.3");
    expect(formatAvgScore(10)).toBe("10.0");
    expect(formatAvgScore(undefined)).toBe("-");
  });
});
