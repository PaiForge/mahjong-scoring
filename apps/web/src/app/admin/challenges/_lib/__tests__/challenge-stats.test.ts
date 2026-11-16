import { describe, expect, it } from "vitest";

import {
  isExamMenuType,
  PRACTICE_MENU_TYPES,
} from "@mahjong-scoring/features/practice-menu-types";

import type { ChallengeCountRow } from "../queries";
import { buildChallengeStats, registryPositionOf } from "../challenge-stats";

/** 表に載る練習の menu_type（期待値はレジストリから導く） */
const LISTED_MENU_TYPES = PRACTICE_MENU_TYPES.filter(
  (menuType) => !isExamMenuType(menuType),
);

/** 昇級試験の menu_type */
const EXAM_MENU_TYPES = PRACTICE_MENU_TYPES.filter(isExamMenuType);

/** レジストリ順で n 番目（0 始まり）の練習の menu_type */
function practiceAt(index: number): string {
  const menuType = LISTED_MENU_TYPES[index];
  if (menuType === undefined)
    throw new Error(`no practice at ${String(index)}`);
  return menuType;
}

function count(
  menuType: string,
  total: number,
  inPeriod: number,
  challengersInPeriod = 0,
): ChallengeCountRow {
  return { menuType, total, inPeriod, challengersInPeriod };
}

describe("buildChallengeStats", () => {
  it("表に載る練習は 3 つ以上あり、昇級試験も 1 つ以上ある（以下のテストの前提）", () => {
    expect(LISTED_MENU_TYPES.length).toBeGreaterThanOrEqual(3);
    expect(EXAM_MENU_TYPES.length).toBeGreaterThanOrEqual(1);
  });

  it("0 回の練習も 0 としてレジストリ順にすべて並び、昇級試験は並ばない", () => {
    const stats = buildChallengeStats([], "registry");

    expect(stats.rows.map((row) => row.menuType)).toEqual(LISTED_MENU_TYPES);
    expect(
      stats.rows.every(
        (row) =>
          row.total === 0 &&
          row.inPeriod === 0 &&
          row.challengersInPeriod === 0,
      ),
    ).toBe(true);
    expect(stats.rows.every((row) => row.practice !== undefined)).toBe(true);
  });

  it("全部 0 なら横棒の分母（maxTotal）と合計は 0", () => {
    const stats = buildChallengeStats([], "total");

    expect(stats).toMatchObject({
      maxTotal: 0,
      totalChallenges: 0,
      periodChallenges: 0,
    });
  });

  it("レジストリに無い menu_type は捨てずに末尾へ昇順で残し、合計と maxTotal に入れる", () => {
    const stats = buildChallengeStats(
      [
        count("zz_removed", 40, 1, 1),
        count(practiceAt(0), 5, 2, 2),
        count("aa_removed", 1, 1, 1),
      ],
      "total",
    );

    expect(stats.rows.slice(-2)).toEqual([
      {
        menuType: "aa_removed",
        practice: undefined,
        total: 1,
        inPeriod: 1,
        challengersInPeriod: 1,
      },
      {
        menuType: "zz_removed",
        practice: undefined,
        total: 40,
        inPeriod: 1,
        challengersInPeriod: 1,
      },
    ]);
    expect(stats.rows).toHaveLength(LISTED_MENU_TYPES.length + 2);
    expect(stats.totalChallenges).toBe(46);
    expect(stats.periodChallenges).toBe(4);
    expect(stats.maxTotal).toBe(40);
  });

  it("昇級試験の menu_type に行があれば、練習の行にせず末尾に出す", () => {
    const exam = EXAM_MENU_TYPES[0];
    if (exam === undefined) throw new Error("no exam menu type");

    const stats = buildChallengeStats([count(exam, 3, 0)], "registry");

    expect(stats.rows.at(-1)).toEqual({
      menuType: exam,
      practice: undefined,
      total: 3,
      inPeriod: 0,
      challengersInPeriod: 0,
    });
    expect(stats.totalChallenges).toBe(3);
  });

  it("レジストリ順では回数に関わらずレジストリの順に並ぶ", () => {
    const stats = buildChallengeStats(
      [count(practiceAt(2), 9, 9), count(practiceAt(1), 5, 1)],
      "registry",
    );

    expect(stats.rows.map((row) => row.menuType)).toEqual(LISTED_MENU_TYPES);
  });

  it("累計の多い順は total の降順で、同数はレジストリ順", () => {
    const stats = buildChallengeStats(
      [
        count(practiceAt(0), 1, 0),
        count(practiceAt(1), 5, 0),
        count(practiceAt(2), 5, 9),
      ],
      "total",
    );

    expect(stats.rows.slice(0, 3).map((row) => row.menuType)).toEqual([
      practiceAt(1),
      practiceAt(2),
      practiceAt(0),
    ]);
    // 残りの 0 回の練習はレジストリ順のまま続く
    expect(stats.rows.slice(3).map((row) => row.menuType)).toEqual(
      LISTED_MENU_TYPES.slice(3),
    );
  });

  it("期間内の多い順は inPeriod の降順で、同数はレジストリ順", () => {
    const stats = buildChallengeStats(
      [
        count(practiceAt(0), 9, 2),
        count(practiceAt(1), 1, 2),
        count(practiceAt(2), 0, 7),
      ],
      "period",
    );

    expect(stats.rows.slice(0, 3).map((row) => row.menuType)).toEqual([
      practiceAt(2),
      practiceAt(0),
      practiceAt(1),
    ]);
  });
});

describe("registryPositionOf", () => {
  it("レジストリ順での 1 始まりの番号を返し、表の練習に無い行は undefined", () => {
    const stats = buildChallengeStats([count(practiceAt(1), 5, 0)], "total");

    expect(registryPositionOf(stats.rows[0]?.practice)).toBe(2);
    expect(registryPositionOf(undefined)).toBeUndefined();
  });
});
