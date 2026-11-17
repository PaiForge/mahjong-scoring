import { beforeEach, describe, expect, it, vi } from "vitest";

import { HaiKind } from "@mahjong-scoring/core";

import { createSelectSequenceMock } from "@/test/drizzle-mock";

import {
  fetchPracticeProblemComposition,
  fetchPracticeProblemCounts,
  fetchPracticeProblemDailyCounts,
} from "../queries";

const selectMock = vi.hoisted(() => ({
  select: vi.fn(),
}));

vi.mock("@/lib/db", async () => ({
  db: { select: selectMock.select },
  ...(await import("@/test/schema-mock")),
}));
vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

const RANGE = {
  startDate: "2026-11-10",
  endDate: "2026-11-12",
  from: new Date("2026-11-09T15:00:00Z"),
  toExclusive: new Date("2026-11-12T15:00:00Z"),
} as const;

const sequence = createSelectSequenceMock();

beforeEach(() => {
  selectMock.select.mockReset();
  selectMock.select.mockImplementation(sequence.select);
});

describe("fetchPracticeProblemCounts", () => {
  it("種別 × 由来ごとの累計・期間内・最終保存日時を、クエリの結果から組み立てる", async () => {
    const savedAt = new Date("2026-11-11T01:00:00Z");
    sequence.setResults([
      {
        kind: "agari-score",
        source: "web",
        total: 12,
        inPeriod: 3,
        lastSavedAt: savedAt,
      },
      {
        kind: "tenpai-score",
        source: "ios",
        total: 1,
        inPeriod: 0,
        lastSavedAt: null,
      },
    ]);

    const result = await fetchPracticeProblemCounts(RANGE);

    expect(selectMock.select).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        kind: "agari-score",
        source: "web",
        total: 12,
        inPeriod: 3,
        lastSavedAt: savedAt,
      },
      {
        kind: "tenpai-score",
        source: "ios",
        total: 1,
        inPeriod: 0,
        lastSavedAt: null,
      },
    ]);
  });

  it("practice_problems を kind, source でまとめ、最終保存日時は列の max で取る", async () => {
    sequence.setResults([]);

    await fetchPracticeProblemCounts(RANGE);

    const [chain] = sequence.chains;
    expect(chain?.from).toHaveBeenCalledWith(
      expect.objectContaining({ _name: "practice_problems" }),
    );
    expect(chain?.groupBy).toHaveBeenCalledWith("kind", "source");
    const [selection] = selectMock.select.mock.calls[0] as [
      { readonly lastSavedAt: unknown },
    ];
    expect(selection.lastSavedAt).toEqual({
      op: "max",
      args: ["created_at"],
    });
  });

  it("期間は created_at の [from, toExclusive) として渡す", async () => {
    sequence.setResults([]);

    await fetchPracticeProblemCounts(RANGE);

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

  it("保存された行が 1 つも無ければ空を返す", async () => {
    sequence.setResults([]);

    expect(await fetchPracticeProblemCounts(RANGE)).toEqual([]);
  });
});

describe("fetchPracticeProblemDailyCounts", () => {
  it("JST の日ごとの件数を、0 件の日も埋めて期間の全日で返す", async () => {
    sequence.setResults([
      { day: "2026-11-12", count: 2 },
      { day: "2026-11-10", count: 5 },
    ]);

    const result = await fetchPracticeProblemDailyCounts(RANGE);

    expect(result).toEqual([
      { date: "2026-11-10", count: 5 },
      { date: "2026-11-11", count: 0 },
      { date: "2026-11-12", count: 2 },
    ]);
  });

  it("日付の式は select と groupBy に同じ値を渡し、期間で絞る", async () => {
    sequence.setResults([]);

    await fetchPracticeProblemDailyCounts(RANGE);

    const [chain] = sequence.chains;
    const [selection] = selectMock.select.mock.calls[0] as [
      { readonly day: unknown },
    ];
    expect(chain?.groupBy).toHaveBeenCalledWith(selection.day);
    expect(chain?.where).toHaveBeenCalledWith({
      op: "and",
      args: [
        { op: "gte", args: ["created_at", RANGE.from] },
        { op: "lt", args: ["created_at", RANGE.toExclusive] },
      ],
    });
  });

  it("期間内に行が無ければ、全日 0 で返す", async () => {
    sequence.setResults([]);

    expect(await fetchPracticeProblemDailyCounts(RANGE)).toEqual([
      { date: "2026-11-10", count: 0 },
      { date: "2026-11-11", count: 0 },
      { date: "2026-11-12", count: 0 },
    ]);
  });
});

describe("fetchPracticeProblemComposition", () => {
  it("種別ごとの保存数と 4 条件の数を、クエリの結果から組み立てる", async () => {
    sequence.setResults([
      {
        kind: "agari-score",
        total: 10,
        riichi: 4,
        furo: 3,
        tsumo: 5,
        oya: 2,
      },
    ]);

    expect(await fetchPracticeProblemComposition()).toEqual([
      { kind: "agari-score", total: 10, riichi: 4, furo: 3, tsumo: 5, oya: 2 },
    ]);
  });

  it("practice_problems を kind でまとめ、親の判定には東の牌種 ID をバインドする", async () => {
    sequence.setResults([]);

    await fetchPracticeProblemComposition();

    const [chain] = sequence.chains;
    expect(chain?.from).toHaveBeenCalledWith(
      expect.objectContaining({ _name: "practice_problems" }),
    );
    expect(chain?.groupBy).toHaveBeenCalledWith("kind");
    const [selection] = selectMock.select.mock.calls[0] as [
      { readonly oya: { readonly values: readonly unknown[] } },
    ];
    expect(selection.oya.values).toContain(HaiKind.Ton);
  });

  it("保存された行が 1 つも無ければ空を返す", async () => {
    sequence.setResults([]);

    expect(await fetchPracticeProblemComposition()).toEqual([]);
  });
});
