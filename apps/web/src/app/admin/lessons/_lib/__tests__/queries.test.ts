import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSelectSequenceMock } from "@/test/drizzle-mock";

import { fetchLessonCompletionCounts } from "../queries";

const selectMock = vi.hoisted(() => ({
  select: vi.fn(),
}));

vi.mock("@/lib/db", async () => ({
  db: { select: selectMock.select },
  ...(await import("@/test/schema-mock")),
}));
vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

const RANGE = {
  from: new Date("2026-10-19T15:00:00Z"),
  toExclusive: new Date("2026-11-16T15:00:00Z"),
} as const;

describe("fetchLessonCompletionCounts", () => {
  const sequence = createSelectSequenceMock();

  beforeEach(() => {
    selectMock.select.mockReset();
    selectMock.select.mockImplementation(sequence.select);
  });

  it("レッスンごとの完了数と完了したユーザー数を、2 つのクエリの結果から組み立てる", async () => {
    sequence.setResults(
      [
        { lessonSlug: "jantou-fu", total: 12, inPeriod: 3 },
        { lessonSlug: "removed-lesson", total: 1, inPeriod: 0 },
      ],
      [{ learners: 9, learnersInPeriod: 2 }],
    );

    const result = await fetchLessonCompletionCounts(RANGE);

    expect(selectMock.select).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      rows: [
        { lessonSlug: "jantou-fu", total: 12, inPeriod: 3 },
        { lessonSlug: "removed-lesson", total: 1, inPeriod: 0 },
      ],
      learners: 9,
      learnersInPeriod: 2,
    });
  });

  it("レッスンごとの集計は lesson_completions を lesson_slug でまとめる", async () => {
    sequence.setResults([], []);

    await fetchLessonCompletionCounts(RANGE);

    const [countsChain, learnersChain] = sequence.chains;
    expect(countsChain?.from).toHaveBeenCalledWith(
      expect.objectContaining({ _name: "lesson_completions" }),
    );
    expect(countsChain?.groupBy).toHaveBeenCalledWith("lesson_slug");
    expect(learnersChain?.from).toHaveBeenCalledWith(
      expect.objectContaining({ _name: "lesson_completions" }),
    );
  });

  it("期間は completed_at の [from, toExclusive) として渡す", async () => {
    sequence.setResults([], []);

    await fetchLessonCompletionCounts(RANGE);

    const [selection] = selectMock.select.mock.calls[0] as [
      { readonly inPeriod: { readonly values: readonly unknown[] } },
    ];
    expect(selection.inPeriod.values).toContainEqual({
      op: "and",
      args: [
        { op: "gte", args: ["completed_at", RANGE.from] },
        { op: "lt", args: ["completed_at", RANGE.toExclusive] },
      ],
    });
  });

  it("完了の行が 1 つも無ければ、レッスンは空・人数は 0 になる", async () => {
    sequence.setResults([], []);

    const result = await fetchLessonCompletionCounts(RANGE);

    expect(result).toEqual({ rows: [], learners: 0, learnersInPeriod: 0 });
  });
});
