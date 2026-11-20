import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { practiceMenuByType } from "../practice-menu-types";

import { getNavigablePreviousPeriod } from "./period";
import {
  aggregateByDay,
  buildChartData,
  computeStats,
  computeStatsComparison,
  formatAvgScore,
  formatDate,
  formatShortDate,
  isCompletedAttempt,
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
      expect(formatDate(EARLY_JST, "ja")).toBe("2026/08/17 01:30");
    });

    it("formatShortDate は JST の月日を出す", () => {
      expect(formatShortDate(EARLY_JST, "ja")).toBe("8月17日");
    });

    it("aggregateByDay は JST の日付でまとめる", () => {
      const daily = aggregateByDay(
        [
          // 2026-08-16 23:00 JST
          attempt("2026-08-16T14:00:00Z", 10),
          // 2026-08-17 01:30 JST（UTC ではまだ 8/16）
          attempt("2026-08-16T16:30:00Z", 20),
          // 2026-08-17 09:00 JST
          attempt("2026-08-17T00:00:00Z", 30),
        ],
        "ja",
      );

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

describe("表示の言語を明示したとき", () => {
  const attempts = [attempt("2026-08-16T16:30:00Z", 20)];

  it("formatDate・formatShortDate は日付が無ければ「-」", () => {
    expect(formatDate(undefined, "en")).toBe("-");
    expect(formatShortDate(undefined, "en")).toBe("-");
  });

  it("toAttemptRows・buildChartData は日本語のラベルを出す", () => {
    expect(toAttemptRows(attempts, 5, "ja")[0]?.date).toBe("2026/08/17 01:30");
    expect(buildChartData(attempts, [], "ja")[0]?.date).toBe("8月17日");
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

describe("完走の判定と平均完走スコア", () => {
  const { mistakeLimit } = practiceMenuByType("jantou_fu");

  function withMistakes(
    score: number,
    incorrectAnswers: number,
  ): ChallengeAttempt {
    return {
      ...attempt("2026-08-17T00:00:00Z", score),
      incorrectAnswers,
    };
  }

  it("ミスがミス上限に届かずに終えたチャレンジは完走", () => {
    expect(isCompletedAttempt(withMistakes(10, mistakeLimit - 1))).toBe(true);
  });

  it("ミス上限ちょうどで終えたチャレンジは完走ではない", () => {
    expect(isCompletedAttempt(withMistakes(10, mistakeLimit))).toBe(false);
  });

  it("平均完走スコアは完走したチャレンジだけで出し、ベストスコアと回数は全チャレンジで数える", () => {
    expect(
      computeStats([
        withMistakes(10, 0),
        withMistakes(20, mistakeLimit - 1),
        withMistakes(90, mistakeLimit),
      ]),
    ).toEqual({ bestScore: 90, avgCompletionScore: 15, totalAttempts: 3 });
  });

  it("完走したチャレンジが無ければ平均完走スコアは undefined", () => {
    expect(computeStats([withMistakes(90, mistakeLimit)])).toEqual({
      bestScore: 90,
      avgCompletionScore: undefined,
      totalAttempts: 1,
    });
  });
});

describe("aggregateByDay の並び", () => {
  it("新しい順に届いたチャレンジも日付の古い順に並べる", () => {
    const daily = aggregateByDay(
      [
        attempt("2026-08-18T00:00:00Z", 30),
        attempt("2026-08-16T00:00:00Z", 10),
        attempt("2026-08-17T00:00:00Z", 20),
      ],
      "ja",
    );
    expect(daily.map((d) => d.dateKey)).toEqual([
      "2026-08-16",
      "2026-08-17",
      "2026-08-18",
    ]);
  });
});

describe("toAttemptRows", () => {
  const attempts = [
    { ...attempt("2026-08-18T00:00:00Z", 30), incorrectAnswers: 1 },
    attempt("2026-08-17T00:00:00Z", 20),
    attempt("2026-08-16T00:00:00Z", 10),
  ];

  it("先頭から上限の件数だけを、正解数を文字列にした行にする", () => {
    expect(toAttemptRows(attempts, 2, "ja")).toEqual([
      { date: "2026/08/18 09:00", correctAnswers: "30", incorrectAnswers: 1 },
      { date: "2026/08/17 09:00", correctAnswers: "20", incorrectAnswers: 0 },
    ]);
  });

  it("上限より少なければ全件を行にする", () => {
    expect(toAttemptRows(attempts, 5, "ja")).toHaveLength(3);
  });
});

describe("buildChartData の前期間", () => {
  /**
   * 今の期間と前の期間を同じ横軸に重ねる。前の期間は日付キーが重ならない
   * （前の週・前の月の日付）ので、両方の日付を古い順に並べ、片方にしか無い日は
   * もう片方を undefined にする
   */
  it("両期間の日付を古い順に並べ、それぞれの日の平均を今と前に振り分ける", () => {
    const chart = buildChartData(
      [
        attempt("2026-08-17T00:00:00Z", 20),
        attempt("2026-08-17T01:00:00Z", 30),
      ],
      [attempt("2026-08-10T00:00:00Z", 12)],
      "ja",
    );

    expect(chart).toEqual([
      {
        date: "8月10日",
        dateKey: "2026-08-10",
        score: undefined,
        previousScore: 12,
      },
      {
        date: "8月17日",
        dateKey: "2026-08-17",
        score: 25,
        previousScore: undefined,
      },
    ]);
  });

  it("同じ日付キーが両期間にあれば 1 点にまとめ、今の期間のラベルを使う", () => {
    const chart = buildChartData(
      [attempt("2026-08-17T00:00:00Z", 20)],
      [attempt("2026-08-17T02:00:00Z", 8)],
      "en",
    );

    expect(chart).toEqual([
      {
        date: "Aug 17",
        dateKey: "2026-08-17",
        score: 20,
        previousScore: 8,
      },
    ]);
  });
});
