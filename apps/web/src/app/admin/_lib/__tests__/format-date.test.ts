import { afterEach, describe, expect, it, vi } from "vitest";

import { formatAdminDate, formatAdminDateTime } from "../format-date";

/** JST では 10/13、UTC では 10/12 になる瞬間 */
const JST_EARLY_MORNING = new Date("2026-10-13T00:30:00+09:00");

describe.each(["Asia/Tokyo", "UTC", "America/Los_Angeles"])(
  "サーバーのタイムゾーンが %s",
  (tz) => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("formatAdminDateTime は JST の日時で表記する", () => {
      vi.stubEnv("TZ", tz);
      expect(formatAdminDateTime(JST_EARLY_MORNING)).toBe("2026/10/13 0:30:00");
      expect(formatAdminDateTime(JST_EARLY_MORNING.toISOString())).toBe(
        "2026/10/13 0:30:00",
      );
    });

    it("formatAdminDate は JST の日付で表記する", () => {
      vi.stubEnv("TZ", tz);
      expect(formatAdminDate(JST_EARLY_MORNING)).toBe("2026/10/13");
    });
  },
);

describe("未設定の値", () => {
  it("null・undefined・空文字は - を返す", () => {
    expect(formatAdminDateTime(null)).toBe("-");
    expect(formatAdminDateTime(undefined)).toBe("-");
    expect(formatAdminDate("")).toBe("-");
  });
});
