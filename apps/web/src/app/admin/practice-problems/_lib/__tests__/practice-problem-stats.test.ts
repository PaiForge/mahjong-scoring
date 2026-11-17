import { describe, expect, it } from "vitest";

import { ARCHIVE_KINDS } from "@mahjong-scoring/core";

import { PRACTICE_PROBLEM_SOURCES } from "@/lib/practice-problems/source";

import {
  buildPracticeProblemStats,
  percentOf,
} from "../practice-problem-stats";
import type { PracticeProblemCountRow } from "../queries";

/** 定数の種別 × 由来の全組（種別の順 → 由来の順。期待値は定数から導く） */
const KNOWN_PAIRS = ARCHIVE_KINDS.flatMap((kind) =>
  PRACTICE_PROBLEM_SOURCES.map((source) => `${kind}/${source}`),
);

function count(
  kind: string,
  source: string,
  total: number,
  inPeriod: number,
  lastSavedAt: Date | null = null,
): PracticeProblemCountRow {
  return { kind, source, total, inPeriod, lastSavedAt };
}

function pairsOf(rows: readonly { kind: string; source: string }[]) {
  return rows.map((row) => `${row.kind}/${row.source}`);
}

describe("buildPracticeProblemStats", () => {
  it("保存 0 件でも、定数の種別 × 由来の全組が 0 として定数の順に並ぶ", () => {
    const stats = buildPracticeProblemStats([]);

    expect(pairsOf(stats.rows)).toEqual(KNOWN_PAIRS);
    expect(
      stats.rows.every(
        (row) =>
          row.known &&
          row.total === 0 &&
          row.inPeriod === 0 &&
          row.lastSavedAt === null,
      ),
    ).toBe(true);
  });

  it("DB の返す順に依らず、行は定数の順に並び、DB の値が入る", () => {
    const savedAt = new Date("2026-11-10T03:00:00Z");
    const stats = buildPracticeProblemStats([
      count("tenpai-score", "ios", 5, 2, savedAt),
      count("agari-score", "web", 30, 4),
    ]);

    expect(pairsOf(stats.rows)).toEqual(KNOWN_PAIRS);
    expect(
      stats.rows.find(
        (row) => row.kind === "tenpai-score" && row.source === "ios",
      ),
    ).toEqual({
      kind: "tenpai-score",
      source: "ios",
      known: true,
      total: 5,
      inPeriod: 2,
      lastSavedAt: savedAt,
    });
  });

  it("定数に無い組は捨てずに末尾へ kind, source の昇順で残し、合計と maxTotal に入れる", () => {
    const stats = buildPracticeProblemStats([
      count("zz-removed", "web", 1, 0),
      count("agari-score", "desktop", 50, 3),
      count("agari-score", "web", 10, 1),
    ]);

    expect(pairsOf(stats.rows)).toEqual([
      ...KNOWN_PAIRS,
      "agari-score/desktop",
      "zz-removed/web",
    ]);
    expect(
      stats.rows.slice(KNOWN_PAIRS.length).every((row) => !row.known),
    ).toBe(true);
    expect(stats).toMatchObject({ total: 61, inPeriod: 4, maxTotal: 50 });
  });

  it("種別ごとの合計（kindTotals）は定数の種別だけを定数の順に持ち、定数に無い組を含めない", () => {
    const stats = buildPracticeProblemStats([
      count("agari-score", "web", 10, 1),
      count("agari-score", "ios", 5, 2),
      count("tenpai-score", "android", 3, 3),
      count("agari-score", "desktop", 50, 3),
      count("zz-removed", "web", 7, 7),
    ]);

    expect(stats.kindTotals).toEqual([
      { kind: "agari-score", total: 15, inPeriod: 3 },
      { kind: "tenpai-score", total: 3, inPeriod: 3 },
    ]);
  });

  it("全部 0 なら横棒の分母（maxTotal）と合計は 0", () => {
    const stats = buildPracticeProblemStats([]);

    expect(stats).toMatchObject({ total: 0, inPeriod: 0, maxTotal: 0 });
  });
});

describe("percentOf", () => {
  it("0〜100 の整数に丸めた割合を返す", () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
    expect(percentOf(5, 5)).toBe(100);
    expect(percentOf(0, 5)).toBe(0);
  });

  it("分母が 0 なら割合は無い（undefined）", () => {
    expect(percentOf(0, 0)).toBeUndefined();
  });
});
