import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ANNOUNCEMENT_DETAIL_DATE_OPTIONS,
  ANNOUNCEMENT_LIST_DATE_OPTIONS,
  formatPublishedDate,
} from "./format";

describe.each(["Asia/Tokyo", "UTC", "America/Los_Angeles"])(
  "formatPublishedDate（実行環境のタイムゾーンが %s）",
  (tz) => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("JST の 0 時台に公開したものは JST の日付で出す（UTC では前日）", () => {
      vi.stubEnv("TZ", tz);
      const publishedAt = new Date("2026-08-20T00:30:00+09:00");
      expect(
        formatPublishedDate(publishedAt, "ja", ANNOUNCEMENT_LIST_DATE_OPTIONS),
      ).toBe("2026/08/20");
      expect(
        formatPublishedDate(
          publishedAt,
          "ja",
          ANNOUNCEMENT_DETAIL_DATE_OPTIONS,
        ),
      ).toBe("2026年8月20日");
    });

    it("ISO 文字列も同じく JST の日付で出す", () => {
      vi.stubEnv("TZ", tz);
      expect(
        formatPublishedDate(
          "2026-08-19T15:30:00.000Z",
          "ja",
          ANNOUNCEMENT_LIST_DATE_OPTIONS,
        ),
      ).toBe("2026/08/20");
    });

    it("未公開（null）は undefined", () => {
      vi.stubEnv("TZ", tz);
      expect(formatPublishedDate(null, "ja")).toBeUndefined();
    });
  },
);
