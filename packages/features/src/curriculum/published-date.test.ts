import { afterEach, describe, expect, it, vi } from "vitest";

import { formatPublishedDate } from "./published-date";

describe("formatPublishedDate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(["Asia/Tokyo", "UTC", "America/Los_Angeles"])(
    "端末のタイムゾーン（%s）に依らず JST の日付で表記する",
    (tz) => {
      vi.stubEnv("TZ", tz);
      expect(formatPublishedDate("2026-04-02", "ja")).toBe("2026年4月2日");
      expect(formatPublishedDate("2026-04-02", "en")).toBe("April 2, 2026");
    },
  );

  it("日本語は年月日の表記", () => {
    expect(formatPublishedDate("2026-11-01", "ja")).toBe("2026年11月1日");
  });

  it("英語は月名の英語表記", () => {
    expect(formatPublishedDate("2026-11-01", "en")).toBe("November 1, 2026");
  });
});
