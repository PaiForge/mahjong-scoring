import { describe, expect, it } from "vitest";

import {
  CURRICULUM,
  LESSON_CHAPTERS,
  isColumnChapter,
} from "@mahjong-scoring/features/curriculum/registry";

import type { LessonCompletionCountRow } from "../queries";
import { buildLessonStats, curriculumPositionOf } from "../lesson-stats";

/** 順路順のレッスンの slug（期待値はレジストリから導く） */
const CURRICULUM_ORDER_SLUGS = [...LESSON_CHAPTERS]
  .sort((a, b) => a.order - b.order)
  .map((chapter) => chapter.slug);

/** 順路で n 番目（0 始まり）のレッスンの slug */
function lessonAt(index: number): string {
  const slug = CURRICULUM_ORDER_SLUGS[index];
  if (slug === undefined) throw new Error(`no lesson at ${String(index)}`);
  return slug;
}

function count(
  lessonSlug: string,
  total: number,
  inPeriod: number,
): LessonCompletionCountRow {
  return { lessonSlug, total, inPeriod };
}

describe("buildLessonStats", () => {
  it("レジストリには 3 つ以上のレッスンがある（以下のテストの前提）", () => {
    expect(CURRICULUM_ORDER_SLUGS.length).toBeGreaterThanOrEqual(3);
  });

  it("完了 0 件のレッスンも 0 として順路順にすべて並ぶ", () => {
    const stats = buildLessonStats([], "curriculum");

    expect(stats.rows.map((row) => row.slug)).toEqual(CURRICULUM_ORDER_SLUGS);
    expect(
      stats.rows.every((row) => row.total === 0 && row.inPeriod === 0),
    ).toBe(true);
    expect(stats.rows.every((row) => row.chapter !== undefined)).toBe(true);
  });

  it("全部 0 なら横棒の分母（maxTotal）と合計は 0", () => {
    const stats = buildLessonStats([], "total");

    expect(stats).toMatchObject({
      maxTotal: 0,
      totalCompletions: 0,
      periodCompletions: 0,
    });
  });

  it("レジストリに無い slug は捨てずに末尾へ slug の昇順で残し、合計と maxTotal に入れる", () => {
    const stats = buildLessonStats(
      [
        count("zz-removed-lesson", 40, 1),
        count(lessonAt(0), 5, 2),
        count("aa-removed-lesson", 1, 1),
      ],
      "total",
    );

    const tail = stats.rows.slice(-2);
    expect(tail).toEqual([
      { slug: "aa-removed-lesson", chapter: undefined, total: 1, inPeriod: 1 },
      { slug: "zz-removed-lesson", chapter: undefined, total: 40, inPeriod: 1 },
    ]);
    expect(stats.rows).toHaveLength(CURRICULUM_ORDER_SLUGS.length + 2);
    expect(stats.totalCompletions).toBe(46);
    expect(stats.periodCompletions).toBe(4);
    expect(stats.maxTotal).toBe(40);
  });

  it("コラムの slug の完了はレッスンの行にせず、レジストリに無い行として末尾に出す", () => {
    const column = CURRICULUM.find(isColumnChapter);
    if (column === undefined) return; // コラムが無ければ確かめることが無い

    const stats = buildLessonStats([count(column.slug, 3, 0)], "curriculum");

    expect(stats.rows.at(-1)).toEqual({
      slug: column.slug,
      chapter: undefined,
      total: 3,
      inPeriod: 0,
    });
  });

  it("順路順では件数に関わらずレジストリの order の順に並ぶ", () => {
    const stats = buildLessonStats(
      [count(lessonAt(2), 9, 9), count(lessonAt(1), 5, 1)],
      "curriculum",
    );

    expect(stats.rows.map((row) => row.slug)).toEqual(CURRICULUM_ORDER_SLUGS);
  });

  it("累計の多い順は total の降順で、同数は順路順", () => {
    const stats = buildLessonStats(
      [
        count(lessonAt(0), 1, 0),
        count(lessonAt(1), 5, 0),
        count(lessonAt(2), 5, 9),
      ],
      "total",
    );

    expect(stats.rows.slice(0, 3).map((row) => row.slug)).toEqual([
      lessonAt(1),
      lessonAt(2),
      lessonAt(0),
    ]);
    // 残りの 0 件のレッスンは順路順のまま続く
    expect(stats.rows.slice(3).map((row) => row.slug)).toEqual(
      CURRICULUM_ORDER_SLUGS.slice(3),
    );
  });

  it("期間内の多い順は inPeriod の降順で、同数は順路順", () => {
    const stats = buildLessonStats(
      [
        count(lessonAt(0), 9, 2),
        count(lessonAt(1), 1, 2),
        count(lessonAt(2), 0, 7),
      ],
      "period",
    );

    expect(stats.rows.slice(0, 3).map((row) => row.slug)).toEqual([
      lessonAt(2),
      lessonAt(0),
      lessonAt(1),
    ]);
  });
});

describe("curriculumPositionOf", () => {
  it("順路順での 1 始まりの番号を返し、レジストリに無い行は undefined", () => {
    const stats = buildLessonStats([count(lessonAt(1), 5, 0)], "total");

    expect(curriculumPositionOf(stats.rows[0]?.chapter)).toBe(2);
    expect(curriculumPositionOf(undefined)).toBeUndefined();
  });
});
