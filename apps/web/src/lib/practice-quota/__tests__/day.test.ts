import { describe, expect, it } from "vitest";

import { jstDayKey } from "../../jst";
import { jstEndOfDay } from "../day";

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
