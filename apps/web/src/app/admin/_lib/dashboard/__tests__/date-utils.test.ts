import { afterEach, describe, expect, it, vi } from "vitest";

import { daysAgo, today } from "../date-utils";

describe.each(["Asia/Tokyo", "UTC", "America/Los_Angeles"])(
  "サーバーのタイムゾーンが %s",
  (tz) => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    describe("today", () => {
      it("now の JST 日付を YYYY-MM-DD で返す", () => {
        vi.stubEnv("TZ", tz);
        expect(today(new Date("2026-08-16T13:45:00+09:00"))).toBe("2026-08-16");
      });

      it("JST の 0 時（UTC 15:00）で切り替わる", () => {
        vi.stubEnv("TZ", tz);
        expect(today(new Date("2026-08-16T14:59:59.999Z"))).toBe("2026-08-16");
        expect(today(new Date("2026-08-16T15:00:00Z"))).toBe("2026-08-17");
      });
    });

    describe("daysAgo", () => {
      it("当日を含む日数分だけ遡った日付を返す", () => {
        vi.stubEnv("TZ", tz);
        // 直近28日 = 開始日から当日までで28日
        expect(daysAgo(28, new Date("2026-08-16T00:00:00+09:00"))).toBe(
          "2026-07-20",
        );
      });

      it("JST の早朝（UTC では前日）も JST の当日から数える", () => {
        vi.stubEnv("TZ", tz);
        // UTC では 2026-08-15T15:30
        expect(daysAgo(1, new Date("2026-08-16T00:30:00+09:00"))).toBe(
          "2026-08-16",
        );
        expect(daysAgo(7, new Date("2026-08-16T00:30:00+09:00"))).toBe(
          "2026-08-10",
        );
      });

      it("月をまたいで遡れる", () => {
        vi.stubEnv("TZ", tz);
        expect(daysAgo(7, new Date("2026-09-03T00:00:00+09:00"))).toBe(
          "2026-08-28",
        );
      });

      it("年をまたいで遡れる", () => {
        vi.stubEnv("TZ", tz);
        expect(daysAgo(90, new Date("2026-01-15T00:00:00+09:00"))).toBe(
          "2025-10-18",
        );
      });

      it("引数の Date を変更しない", () => {
        vi.stubEnv("TZ", tz);
        const now = new Date("2026-08-16T00:00:00+09:00");
        const before = now.toISOString();

        daysAgo(28, now);

        expect(now.toISOString()).toBe(before);
      });
    });
  },
);
