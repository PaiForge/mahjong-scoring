import { describe, expect, it } from "vitest";

import { buildJourney } from "./journey";
import {
  input,
  KYU5_LESSONS_DONE,
  KYU5_PRACTICES_ATTEMPTED,
} from "./journey-input.fixture";
import { countProgress, currentStage } from "./journey-progress";

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
