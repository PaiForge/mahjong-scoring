import { describe, expect, it } from "vitest";

import type { PracticeMenuSlug } from "../practice-menu-types";
import { RANK_REGISTRY, RANK_SLUGS, type RankSlug } from "../ranks/registry";
import { buildJourney, countProgress, type BuildJourneyInput } from "./journey";

const NONE: ReadonlySet<string> = new Set();
const NO_ATTEMPTS: ReadonlySet<PracticeMenuSlug> = new Set();
const NO_RANKS: readonly RankSlug[] = [];

function input(overrides: Partial<BuildJourneyInput> = {}): BuildJourneyInput {
  return {
    readSlugs: NONE,
    completedLessonSlugs: NONE,
    attemptedSlugs: NO_ATTEMPTS,
    achievedRankSlugs: NO_RANKS,
    ...overrides,
  };
}

/** 5級の前提章をすべて読んだ状態 */
const KYU5_CHAPTERS_READ: ReadonlySet<string> = new Set(
  RANK_REGISTRY[0].learnChapterSlugs,
);

describe("buildJourney", () => {
  it("全段級位を level 昇順で並べ、取得状態を付ける", () => {
    const journey = buildJourney(input({ achievedRankSlugs: ["kyu-5"] }));

    expect(journey.ranks.map((entry) => entry.rank.slug)).toEqual(RANK_SLUGS);
    expect(journey.ranks.map((entry) => entry.status)).toEqual([
      "achieved",
      "next",
      "unachieved",
      "unachieved",
      "unachieved",
      "unachieved",
    ]);
    expect(journey.current?.rank.slug).toBe("kyu-4");
  });

  it("何も始めていなければ isFresh で、次の一歩は最初の章のレッスン", () => {
    const journey = buildJourney(input());

    expect(journey.isFresh).toBe(true);
    expect(journey.current?.rank.slug).toBe("kyu-5");
    expect(journey.nextStep).toEqual({
      kind: "lesson",
      lessonSlug: "mangan-ko-ron",
      chapterSlug: "mangan-ko-ron",
    });
  });

  it("レッスンを終えると、その章は学んだことになり、次はレッスンの無い章を読む", () => {
    const journey = buildJourney(
      input({ completedLessonSlugs: new Set(["mangan-ko-ron"]) }),
    );

    expect(journey.isFresh).toBe(false);
    expect(journey.current?.chapters[0]).toEqual({
      chapterSlug: "mangan-ko-ron",
      lessonSlug: "mangan-ko-ron",
      done: true,
    });
    expect(journey.nextStep).toEqual({
      kind: "read",
      chapterSlug: "mangan-ko-tsumo",
    });
  });

  it("章を読了していれば、レッスンがあってもその章は済み", () => {
    const journey = buildJourney(
      input({ readSlugs: new Set(["mangan-ko-ron"]) }),
    );

    expect(journey.current?.chapters[0].done).toBe(true);
    expect(journey.nextStep?.kind).toBe("read");
  });

  it("前提章をすべて学ぶと、次は章から送っている未挑戦の練習（章の順・重複なし・試験を除く）", () => {
    const journey = buildJourney(input({ readSlugs: KYU5_CHAPTERS_READ }));

    expect(journey.current?.practices.map((item) => item.slug)).toEqual([
      "score-table",
      "mangan-score-calculation",
      "yaku-han",
      "yaku",
      "han-count",
    ]);
    expect(journey.current?.practices[0]).toEqual({
      slug: "score-table",
      variant: "ko_mangan_plus",
      done: false,
    });
    expect(journey.nextStep).toEqual({
      kind: "practice",
      slug: "score-table",
      variant: "ko_mangan_plus",
    });
  });

  it("挑戦済みの練習は飛ばして次の未挑戦を指す", () => {
    const journey = buildJourney(
      input({
        readSlugs: KYU5_CHAPTERS_READ,
        attemptedSlugs: new Set(["score-table", "mangan-score-calculation"]),
      }),
    );

    expect(journey.nextStep).toEqual({
      kind: "practice",
      slug: "yaku-han",
      variant: undefined,
    });
  });

  it("学ぶ・練習するが済むと、次は昇級試験", () => {
    const journey = buildJourney(
      input({
        readSlugs: KYU5_CHAPTERS_READ,
        attemptedSlugs: new Set([
          "score-table",
          "mangan-score-calculation",
          "yaku-han",
          "yaku",
          "han-count",
        ]),
      }),
    );

    expect(journey.nextStep).toEqual({ kind: "exam", slug: "mangan-exam" });
    expect(journey.current?.exam.done).toBe(false);
  });

  it("前提章を持たない級（初段）では、学ぶ・練習するが空で、次はすぐ試験", () => {
    const allButDan = RANK_SLUGS.filter((slug) => slug !== "dan-1");
    const journey = buildJourney(input({ achievedRankSlugs: allButDan }));

    expect(journey.current?.rank.slug).toBe("dan-1");
    expect(journey.current?.chapters).toEqual([]);
    expect(journey.current?.practices).toEqual([]);
    expect(journey.nextStep).toEqual({ kind: "exam", slug: "score-exam" });
  });

  it("全級取得済みなら current も nextStep も無い", () => {
    const journey = buildJourney(input({ achievedRankSlugs: RANK_SLUGS }));

    expect(journey.current).toBeUndefined();
    expect(journey.nextStep).toBeUndefined();
    expect(journey.ranks.every((entry) => entry.exam.done)).toBe(true);
  });

  it("飛び番で級を持つユーザーでも、次は最下位の未取得の級", () => {
    const journey = buildJourney(
      input({ achievedRankSlugs: ["kyu-5", "kyu-2"] }),
    );

    expect(journey.current?.rank.slug).toBe("kyu-4");
  });
});

describe("countProgress", () => {
  it("済んだ数と全体を数える", () => {
    const journey = buildJourney(
      input({ readSlugs: new Set(["mangan-ko-ron", "yaku"]) }),
    );

    expect(countProgress(journey.current?.chapters ?? [])).toEqual({
      done: 2,
      total: 5,
    });
    expect(countProgress([])).toEqual({ done: 0, total: 0 });
  });
});
