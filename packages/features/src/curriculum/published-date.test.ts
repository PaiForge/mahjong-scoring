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
      expect(formatPublishedDate("2026-04-02")).toBe("2026年4月2日");
    },
  );
});
