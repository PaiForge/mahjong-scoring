import { describe, expect, it } from "vitest";

import {
  buildJourney,
  stepAfterLessonWithProgress,
  type BuildJourneyInput,
  type JourneyStep,
} from "../journey/journey";
import { countProgress } from "../journey/journey-progress";
import { RANK_REGISTRY } from "../ranks/registry";
import { isNextStepPractice, lessonFollowUp } from "./follow-up";

/** 何も終えていない登録直後の進み具合 */
const FRESH: BuildJourneyInput = {
  completedLessonSlugs: new Set(),
  attemptedPractices: [],
  achievedRankSlugs: [],
};

function learnChapterCount(rankSlug: string): number {
  const rank = RANK_REGISTRY.find((entry) => entry.slug === rankSlug);
  if (rank === undefined) throw new Error(`段級位が無い: ${rankSlug}`);
  return rank.learnChapterSlugs.length;
}

describe("lessonFollowUp", () => {
  it("読み取りが記録より前でも、終えたレッスン自身を学ぶ段の済みに数える", () => {
    const followUp = lessonFollowUp("jantou-fu", FRESH);

    expect(followUp.rankJourneyProgress?.learn).toEqual({
      done: 1,
      total: learnChapterCount("kyu-4"),
    });
    expect(followUp.rankJourneyProgress?.examPassed).toBe(false);
  });

  it("進み具合はそのレッスンの級の行程を、道場の行程カードと同じ数え方で数える", () => {
    const input: BuildJourneyInput = {
      ...FRESH,
      completedLessonSlugs: new Set(["mangan-ko-ron", "jantou-fu"]),
    };
    const rank = buildJourney(input).ranks.find(
      (journey) => journey.rank.slug === "kyu-4",
    );

    expect(lessonFollowUp("mentsu-fu", input).rankJourneyProgress).toEqual({
      learn: { done: 2, total: learnChapterCount("kyu-4") },
      practice: countProgress(rank?.practices ?? []),
      examPassed: false,
    });
    // 別の級（5 級）のレッスンは 5 級の行程を数える
    expect(
      lessonFollowUp("mangan-ko-ron", input).rankJourneyProgress?.learn,
    ).toEqual({ done: 1, total: learnChapterCount("kyu-5") });
  });

  it("その級を取得済みなら試験は合格として数える", () => {
    const followUp = lessonFollowUp("jantou-fu", {
      ...FRESH,
      achievedRankSlugs: ["kyu-5", "kyu-4"],
    });

    expect(followUp.rankJourneyProgress?.examPassed).toBe(true);
  });

  it("次の一歩は、終えたレッスンを済みとした進み具合の一歩", () => {
    const input: BuildJourneyInput = {
      ...FRESH,
      completedLessonSlugs: new Set(["mentsu-fu"]),
    };

    expect(lessonFollowUp("jantou-fu", input).next).toEqual(
      stepAfterLessonWithProgress("jantou-fu", input),
    );
    expect(lessonFollowUp("jantou-fu", input).next).toBeDefined();
  });
});

describe("isNextStepPractice", () => {
  const step: JourneyStep = {
    kind: "practice",
    slug: "score-table",
    variant: "ko_mangan_plus",
  };

  it("同じ練習の同じバリアントを指すリンクだけを同じとみなす", () => {
    expect(
      isNextStepPractice(step, {
        slug: "score-table",
        variant: "ko_mangan_plus",
      }),
    ).toBe(true);
    expect(
      isNextStepPractice(step, {
        slug: "score-table",
        variant: "oya_mangan_plus",
      }),
    ).toBe(false);
    expect(isNextStepPractice(step, { slug: "score-table" })).toBe(false);
    expect(
      isNextStepPractice(step, {
        slug: "mangan-score-calculation",
        variant: "ko_mangan_plus",
      }),
    ).toBe(false);
  });

  it("バリアントを持たない練習は、リンクもバリアントを持たないときに同じ", () => {
    const plain: JourneyStep = {
      kind: "practice",
      slug: "jantou-fu",
      variant: undefined,
    };
    expect(isNextStepPractice(plain, { slug: "jantou-fu" })).toBe(true);
  });

  it("次の一歩が無い・練習でない（レッスン・試験）ときは同じとみなさない", () => {
    const link = { slug: "jantou-fu" } as const;
    expect(isNextStepPractice(undefined, link)).toBe(false);
    expect(
      isNextStepPractice({ kind: "lesson", chapterSlug: "jantou-fu" }, link),
    ).toBe(false);
    expect(isNextStepPractice({ kind: "exam", slug: "jantou-fu" }, link)).toBe(
      false,
    );
  });
});
