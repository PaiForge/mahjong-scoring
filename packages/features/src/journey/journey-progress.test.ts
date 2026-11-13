import { describe, expect, it } from "vitest";

import { buildJourney } from "./journey";
import {
  input,
  KYU5_LESSONS_DONE,
  KYU5_PRACTICES_ATTEMPTED,
} from "./journey-input.fixture";
import {
  buildStageCells,
  countProgress,
  currentStage,
} from "./journey-progress";

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

describe("buildStageCells", () => {
  /** 辞書の形を真似た翻訳関数（キーの取り違えが見えるよう素通しにしない） */
  const t = (
    key: string,
    values?: Readonly<Record<string, string | number>>,
  ): string =>
    key === "stageCount" ? `${values?.done} / ${values?.total}` : `<${key}>`;

  it("学ぶ・練習する・試験の順に、数と未合格を並べる", () => {
    const journey = buildJourney(
      input({ completedLessonSlugs: new Set(["mangan-ko-ron", "yaku"]) }),
    );
    const rank = journey.ranks[0];
    const learn = countProgress(rank.chapters);
    const practice = countProgress(rank.practices);

    expect(buildStageCells(rank, t)).toEqual([
      { stage: "learn", value: `2 / ${learn.total}`, done: false },
      {
        stage: "practice",
        value: `${practice.done} / ${practice.total}`,
        done: false,
      },
      { stage: "exam", value: "<stageExamNotPassed>", done: false },
    ]);
  });

  it("数えるものが無い段は並べず、合格した試験は済みにする", () => {
    const journey = buildJourney(input());
    const rank = journey.ranks[0];

    expect(
      buildStageCells(
        {
          ...rank,
          chapters: [],
          practices: [],
          exam: { ...rank.exam, done: true },
        },
        t,
      ),
    ).toEqual([{ stage: "exam", value: "<stageExamPassed>", done: true }]);
  });

  it("全部済んだ段は済みにする", () => {
    const journey = buildJourney(input());
    const rank = journey.ranks[0];
    const cells = buildStageCells(
      { ...rank, chapters: rank.chapters.map((c) => ({ ...c, done: true })) },
      t,
    );

    expect(cells[0]).toMatchObject({ stage: "learn", done: true });
  });
});
