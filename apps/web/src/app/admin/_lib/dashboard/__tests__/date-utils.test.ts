import { describe, expect, it } from "vitest";

import { daysAgo, today } from "../date-utils";

/** UTC 基準で Date を組み立てる（実装が UTC で日付を切り出すため） */
function utc(iso: string): Date {
  return new Date(iso);
}

describe("today", () => {
  it("now の UTC 日付を YYYY-MM-DD で返す", () => {
    expect(today(utc("2026-08-16T13:45:00Z"))).toBe("2026-08-16");
  });

  it("UTC の日付境界で切り替わる", () => {
    expect(today(utc("2026-08-16T23:59:59.999Z"))).toBe("2026-08-16");
    expect(today(utc("2026-08-17T00:00:00Z"))).toBe("2026-08-17");
  });
});

describe("daysAgo", () => {
  it("当日を含む日数分だけ遡った日付を返す", () => {
    // 直近28日 = 開始日から当日までで28日
    expect(daysAgo(28, utc("2026-08-16T00:00:00Z"))).toBe("2026-07-20");
  });

  it("1日なら当日を返す", () => {
    expect(daysAgo(1, utc("2026-08-16T12:00:00Z"))).toBe("2026-08-16");
  });

  it("月をまたいで遡れる", () => {
    expect(daysAgo(7, utc("2026-09-03T00:00:00Z"))).toBe("2026-08-28");
  });

  it("年をまたいで遡れる", () => {
    expect(daysAgo(90, utc("2026-01-15T00:00:00Z"))).toBe("2025-10-18");
  });

  it("引数の Date を変更しない", () => {
    const now = utc("2026-08-16T00:00:00Z");
    const before = now.toISOString();

    daysAgo(28, now);

    expect(now.toISOString()).toBe(before);
  });
});
