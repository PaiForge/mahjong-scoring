import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSelectSequenceMock } from "@/test/drizzle-mock";

import { fetchChallengeCounts } from "../queries";

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

describe("fetchChallengeCounts", () => {
  const sequence = createSelectSequenceMock();

  beforeEach(() => {
    selectMock.select.mockReset();
    selectMock.select.mockImplementation(sequence.select);
  });

  it("練習ごとの回数・挑戦者数と全体の挑戦者数を、2 つのクエリの結果から組み立てる", async () => {
    sequence.setResults(
      [
        {
          menuType: "jantou_fu",
          total: 30,
          inPeriod: 8,
          challengersInPeriod: 3,
        },
        {
          menuType: "removed_practice",
          total: 2,
          inPeriod: 0,
          challengersInPeriod: 0,
        },
      ],
      [{ challengers: 11, challengersInPeriod: 4 }],
    );

    const result = await fetchChallengeCounts(RANGE);

    expect(selectMock.select).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      rows: [
        {
          menuType: "jantou_fu",
          total: 30,
          inPeriod: 8,
          challengersInPeriod: 3,
        },
        {
          menuType: "removed_practice",
          total: 2,
          inPeriod: 0,
          challengersInPeriod: 0,
        },
      ],
      challengers: 11,
      challengersInPeriod: 4,
    });
  });

  it("練習ごとの集計は challenge_results を menu_type でまとめる（leaderboard_key では分けない）", async () => {
    sequence.setResults([], []);

    await fetchChallengeCounts(RANGE);

    const [countsChain, challengersChain] = sequence.chains;
    expect(countsChain?.from).toHaveBeenCalledWith(
      expect.objectContaining({ _name: "challenge_results" }),
    );
    expect(countsChain?.groupBy).toHaveBeenCalledWith("menu_type");
    expect(challengersChain?.from).toHaveBeenCalledWith(
      expect.objectContaining({ _name: "challenge_results" }),
    );
  });

  it("期間は created_at の [from, toExclusive) として渡す", async () => {
    sequence.setResults([], []);

    await fetchChallengeCounts(RANGE);

    const [selection] = selectMock.select.mock.calls[0] as [
      { readonly inPeriod: { readonly values: readonly unknown[] } },
    ];
    expect(selection.inPeriod.values).toContainEqual({
      op: "and",
      args: [
        { op: "gte", args: ["created_at", RANGE.from] },
        { op: "lt", args: ["created_at", RANGE.toExclusive] },
      ],
    });
  });

  it("記録が 1 つも無ければ、練習は空・人数は 0 になる", async () => {
    sequence.setResults([], []);

    const result = await fetchChallengeCounts(RANGE);

    expect(result).toEqual({
      rows: [],
      challengers: 0,
      challengersInPeriod: 0,
    });
  });
});
