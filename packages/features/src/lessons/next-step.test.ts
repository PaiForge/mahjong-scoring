import { describe, expect, it } from "vitest";
import type { JourneyStep } from "../journey/journey";
import { resolveLessonNextStep } from "./next-step";

const planned: JourneyStep = { kind: "lesson", chapterSlug: "mentsu-fu" };

describe("resolveLessonNextStep", () => {
  it("進み具合の一歩が無ければ道筋の順に従う", () => {
    expect(resolveLessonNextStep(planned, undefined, "mentsu-fu")).toEqual({
      usePlanned: true,
      step: planned,
    });
  });

  it("進み具合の一歩がプレビューのレッスンと同じなら道筋の順に従う", () => {
    expect(resolveLessonNextStep(planned, planned, "mentsu-fu")).toEqual({
      usePlanned: true,
      step: planned,
    });
  });

  it("進み具合の一歩が別の所を指すならそちらへ", () => {
    const practice: JourneyStep = {
      kind: "practice",
      slug: "mentsu-fu",
      variant: undefined,
    };
    expect(resolveLessonNextStep(planned, practice, "mentsu-fu")).toEqual({
      usePlanned: false,
      step: practice,
    });
    // プレビューの無いレッスンを指すときも、道筋の順ではなくそちら
    const other: JourneyStep = { kind: "lesson", chapterSlug: "machi-fu" };
    expect(resolveLessonNextStep(planned, other, "mentsu-fu")).toEqual({
      usePlanned: false,
      step: other,
    });
  });
});
