import { describe, expect, it } from "vitest";

import { jstDayKey, jstEndOfDay } from "../day";

describe("jstDayKey", () => {
  it("UTC の日付ではなく JST の日付を返す（UTC 15:00 以降は翌日）", () => {
    expect(jstDayKey(new Date("2026-10-01T14:59:59Z"))).toBe("2026-10-01");
    expect(jstDayKey(new Date("2026-10-01T15:00:00Z"))).toBe("2026-10-02");
  });

  it("月末・年末の繰り上がりも JST で判定する", () => {
    expect(jstDayKey(new Date("2026-12-31T15:00:00Z"))).toBe("2027-01-01");
  });
});

describe("jstEndOfDay", () => {
  it("JST の翌日 0 時（UTC 15:00）を返す", () => {
    expect(jstEndOfDay(new Date("2026-10-01T03:00:00Z")).toISOString()).toBe(
      "2026-10-01T15:00:00.000Z",
    );
  });

  it("JST の 0 時直前なら次の 0 時までが残り", () => {
    expect(jstEndOfDay(new Date("2026-10-01T14:59:59Z")).toISOString()).toBe(
      "2026-10-01T15:00:00.000Z",
    );
    expect(jstEndOfDay(new Date("2026-10-01T15:00:00Z")).toISOString()).toBe(
      "2026-10-02T15:00:00.000Z",
    );
  });

  it("jstDayKey と同じ日付境界を使う", () => {
    const now = new Date("2026-10-01T10:00:00Z");
    const end = jstEndOfDay(now);
    expect(jstDayKey(new Date(end.getTime() - 1))).toBe(jstDayKey(now));
    expect(jstDayKey(end)).not.toBe(jstDayKey(now));
  });
});
