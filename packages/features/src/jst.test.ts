import { describe, expect, it } from "vitest";

import { jstCalendarDate, jstDayKey, jstStartOfDay } from "./jst";

describe("jstCalendarDate", () => {
  it("UTC の日付ではなく JST の日付を返す（UTC 15:00 以降は翌日）", () => {
    expect(jstCalendarDate(new Date("2026-08-16T14:59:59Z"))).toEqual({
      year: 2026,
      month: 8,
      day: 16,
      weekday: 0,
    });
    expect(jstCalendarDate(new Date("2026-08-16T15:00:00Z"))).toEqual({
      year: 2026,
      month: 8,
      day: 17,
      weekday: 1,
    });
  });

  it("年末の繰り上がりも JST で判定する", () => {
    expect(jstCalendarDate(new Date("2026-12-31T15:00:00Z"))).toMatchObject({
      year: 2027,
      month: 1,
      day: 1,
    });
  });
});

describe("jstStartOfDay", () => {
  it("JST の 0:00 は UTC の前日 15:00", () => {
    expect(jstStartOfDay(2026, 8, 17).toISOString()).toBe(
      "2026-08-16T15:00:00.000Z",
    );
  });

  it("月・日の範囲外は繰り上がる", () => {
    expect(jstStartOfDay(2026, 13, 1)).toEqual(jstStartOfDay(2027, 1, 1));
    expect(jstStartOfDay(2026, 3, 0)).toEqual(jstStartOfDay(2026, 2, 28));
    expect(jstStartOfDay(2026, 1, -6)).toEqual(jstStartOfDay(2025, 12, 25));
  });

  it("jstCalendarDate と往復できる", () => {
    const now = new Date("2026-10-15T10:00:00Z");
    const { year, month, day } = jstCalendarDate(now);
    const start = jstStartOfDay(year, month, day);
    expect(jstCalendarDate(start)).toMatchObject({ year, month, day });
    expect(jstCalendarDate(new Date(start.getTime() - 1)).day).toBe(day - 1);
  });
});

describe("jstDayKey", () => {
  it("UTC の日付ではなく JST の日付を返す（UTC 15:00 以降は翌日）", () => {
    expect(jstDayKey(new Date("2026-10-01T14:59:59Z"))).toBe("2026-10-01");
    expect(jstDayKey(new Date("2026-10-01T15:00:00Z"))).toBe("2026-10-02");
  });

  it("月末・年末の繰り上がりも JST で判定する", () => {
    expect(jstDayKey(new Date("2026-12-31T15:00:00Z"))).toBe("2027-01-01");
  });
});
