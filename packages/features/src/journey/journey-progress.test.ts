import { describe, expect, it } from "vitest";

import { DEFAULT_VARIANT } from "../practice-menu-types";
import { RANK_REGISTRY, type RankSlug } from "../ranks/registry";
import {
  buildJourney,
  type BuildJourneyInput,
  type PracticeAttempt,
} from "./journey";
import { countProgress, currentStage } from "./journey-progress";

const NONE: ReadonlySet<string> = new Set();
const NO_ATTEMPTS: readonly PracticeAttempt[] = [];
const NO_RANKS: readonly RankSlug[] = [];

function input(overrides: Partial<BuildJourneyInput> = {}): BuildJourneyInput {
  return {
    completedLessonSlugs: NONE,
    attemptedPractices: NO_ATTEMPTS,
    achievedRankSlugs: NO_RANKS,
    ...overrides,
  };
}

/** 5級の前提章（レッスン）をすべて終えた状態 */
const KYU5_LESSONS_DONE: ReadonlySet<string> = new Set(
  RANK_REGISTRY[0].learnChapterSlugs,
);

/** 5級の章から送っている練習に、章が指す土俵ですべて挑戦した状態 */
const KYU5_PRACTICES_ATTEMPTED: readonly PracticeAttempt[] = [
  { slug: "score-table", variant: "ko_mangan_plus" },
  { slug: "score-table", variant: "oya_mangan_plus" },
  { slug: "mangan-score-calculation", variant: DEFAULT_VARIANT },
  { slug: "yaku-han", variant: "no_kuisagari" },
  { slug: "yaku", variant: DEFAULT_VARIANT },
  { slug: "han-count", variant: DEFAULT_VARIANT },
];

describe("countProgress", () => {
  it("済んだ数と全体を数える", () => {
    const journey = buildJourney(
      input({ completedLessonSlugs: new Set(["mangan-ko-ron", "yaku"]) }),
    );

    expect(countProgress(journey.current?.chapters ?? [])).toEqual({
      done: 2,
      total: 5,
    });
    expect(countProgress([])).toEqual({ done: 0, total: 0 });
  });
});

describe("currentStage", () => {
  it("何も始めていなければ学ぶ段", () => {
    const journey = buildJourney(input());

    expect(currentStage(journey.ranks[0])).toBe("learn");
  });

  it("章を学んだ直後はその章から送る練習の段（学ぶが残っていても）", () => {
    const journey = buildJourney(
      input({
        completedLessonSlugs: new Set(["mangan-ko-ron", "mangan-ko-tsumo"]),
      }),
    );

    expect(journey.nextStep?.kind).toBe("practice");
    expect(currentStage(journey.ranks[0])).toBe("practice");
  });

  it("学ぶ・練習するが済んだら試験の段、合格した級は（学ぶが残っていても）無い", () => {
    const journey = buildJourney(
      input({
        completedLessonSlugs: KYU5_LESSONS_DONE,
        attemptedPractices: KYU5_PRACTICES_ATTEMPTED,
      }),
    );

    expect(currentStage(journey.ranks[0])).toBe("exam");

    const passed = buildJourney(input({ achievedRankSlugs: ["kyu-5"] }));
    expect(currentStage(passed.ranks[0])).toBeUndefined();
  });
});
