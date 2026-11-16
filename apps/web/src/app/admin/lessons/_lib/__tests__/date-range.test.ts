import { describe, expect, it } from "vitest";

import { resolveJstDateRange } from "../date-range";

const FALLBACK = { startDate: "2026-10-20", endDate: "2026-11-16" } as const;

describe("resolveJstDateRange", () => {
  it("JST の日付の境界を UTC の前日 15:00 に置き、終了日の翌日 0:00 を含まない端にする", () => {
    const range = resolveJstDateRange("2026-11-01", "2026-11-16", FALLBACK);

    expect(range).toEqual({
      startDate: "2026-11-01",
      endDate: "2026-11-16",
      from: new Date("2026-10-31T15:00:00Z"),
      toExclusive: new Date("2026-11-16T15:00:00Z"),
    });
  });

  it("開始日と終了日が同じ日なら、その 1 日分の区間になる", () => {
    const range = resolveJstDateRange("2026-11-16", "2026-11-16", FALLBACK);

    expect(range.from).toEqual(new Date("2026-11-15T15:00:00Z"));
    expect(range.toExclusive).toEqual(new Date("2026-11-16T15:00:00Z"));
  });

  it("月末の終了日は翌月 1 日の 0:00 を端にする", () => {
    const range = resolveJstDateRange("2026-02-01", "2026-02-28", FALLBACK);

    expect(range.toExclusive).toEqual(new Date("2026-02-28T15:00:00Z"));
  });

  it("年末の終了日は翌年 1 月 1 日の 0:00 を端にする", () => {
    const range = resolveJstDateRange("2026-12-01", "2026-12-31", FALLBACK);

    expect(range.toExclusive).toEqual(new Date("2026-12-31T15:00:00Z"));
  });

  it.each([
    ["形式違い（区切りが違う）", "2026/11/01", "2026-11-16"],
    ["形式違い（ゼロ埋めなし）", "2026-11-1", "2026-11-16"],
    ["形式違い（空文字）", "", "2026-11-16"],
    ["暦に無い日（2 月 30 日）", "2026-02-01", "2026-02-30"],
    ["暦に無い日（13 月）", "2026-13-01", "2026-11-16"],
    ["開始 > 終了", "2026-11-16", "2026-11-01"],
  ])("%s なら両方を既定の期間に落とす", (_label, startDate, endDate) => {
    const range = resolveJstDateRange(startDate, endDate, FALLBACK);

    expect(range).toEqual({
      startDate: FALLBACK.startDate,
      endDate: FALLBACK.endDate,
      from: new Date("2026-10-19T15:00:00Z"),
      toExclusive: new Date("2026-11-16T15:00:00Z"),
    });
  });

  it("既定の期間まで不正なら呼び出し側の誤りとして throw する", () => {
    expect(() =>
      resolveJstDateRange("x", "y", { startDate: "x", endDate: "y" }),
    ).toThrow();
  });
});
