import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getPeriodRange, getPreviousPeriodRange } from "./period";

/** JST の年月日時分秒を表す瞬間 */
function jst(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
): Date {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hours).padStart(2, "0");
  const mi = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return new Date(`${year}-${mm}-${dd}T${hh}:${mi}:${ss}+09:00`);
}

/** 2026-08-16 は日曜日（その週の月曜は 8/10） */
const SUNDAY = jst(2026, 8, 16, 13, 45);

/**
 * 期間の境界はサーバー（Vercel = UTC）とブラウザ（JST）で同じ瞬間を指すこと。
 *
 * `now` は絶対時刻で固定し、プロセスの TZ だけを切り替えて同じ結果になることを
 * 確かめる。JST の 0〜9 時は UTC では前日なので、ローカル時刻で週・月を切ると
 * この時間帯で境界がずれる。
 */
describe.each(["UTC", "Asia/Tokyo", "America/Los_Angeles"])(
  "実行環境の TZ が %s のとき",
  (tz) => {
    beforeAll(() => {
      vi.stubEnv("TZ", tz);
    });

    afterAll(() => {
      vi.unstubAllEnvs();
    });

    describe("getPeriodRange", () => {
      it("thisWeek は月曜 0:00 から次の月曜 0:00 まで（日曜を週の末日として扱う）", () => {
        const range = getPeriodRange("thisWeek", SUNDAY);

        expect(range.start).toEqual(jst(2026, 8, 10));
        expect(range.end).toEqual(jst(2026, 8, 17));
      });

      it("thisWeek は月をまたぐ週も正しく返す", () => {
        // 2026-09-02 は水曜日。その週の月曜は 8/31。
        const range = getPeriodRange("thisWeek", jst(2026, 9, 2));

        expect(range.start).toEqual(jst(2026, 8, 31));
        expect(range.end).toEqual(jst(2026, 9, 7));
      });

      it("lastWeek は今週の1週前（月曜〜日曜）", () => {
        const range = getPeriodRange("lastWeek", SUNDAY);

        expect(range.start).toEqual(jst(2026, 8, 3));
        expect(range.end).toEqual(jst(2026, 8, 10));
      });

      it("thisMonth は月初から翌月初まで", () => {
        const range = getPeriodRange("thisMonth", SUNDAY);

        expect(range.start).toEqual(jst(2026, 8, 1));
        expect(range.end).toEqual(jst(2026, 9, 1));
      });

      it("lastMonth は前月の月初から当月初まで（30日月も末日を含む）", () => {
        const range = getPeriodRange("lastMonth", jst(2026, 7, 5));

        expect(range.start).toEqual(jst(2026, 6, 1));
        expect(range.end).toEqual(jst(2026, 7, 1));
      });

      it("年をまたぐ lastMonth も正しく返す", () => {
        const range = getPeriodRange("lastMonth", jst(2026, 1, 20));

        expect(range.start).toEqual(jst(2025, 12, 1));
        expect(range.end).toEqual(jst(2026, 1, 1));
      });

      it("時刻を含む now を渡しても日付境界に丸められる", () => {
        const range = getPeriodRange("thisMonth", jst(2026, 8, 16, 23, 59, 59));

        expect(range.start).toEqual(jst(2026, 8, 1));
      });

      it("JST の 0〜9 時（UTC ではまだ前日）でも JST の週で切る", () => {
        // 2026-08-17 (月) 01:00 JST = 2026-08-16 (日) 16:00 UTC
        const range = getPeriodRange("thisWeek", jst(2026, 8, 17, 1));

        expect(range.start).toEqual(jst(2026, 8, 17));
        expect(range.end).toEqual(jst(2026, 8, 24));
      });

      it("JST の 0〜9 時（UTC ではまだ前月）でも JST の月で切る", () => {
        // 2026-09-01 (火) 03:00 JST = 2026-08-31 18:00 UTC
        const range = getPeriodRange("thisMonth", jst(2026, 9, 1, 3));

        expect(range.start).toEqual(jst(2026, 9, 1));
        expect(range.end).toEqual(jst(2026, 10, 1));
      });
    });

    describe("getPreviousPeriodRange", () => {
      it("thisWeek の前期間は lastWeek と一致する", () => {
        expect(getPreviousPeriodRange("thisWeek", SUNDAY)).toEqual(
          getPeriodRange("lastWeek", SUNDAY),
        );
      });

      it("lastWeek の前期間は2週前", () => {
        const range = getPreviousPeriodRange("lastWeek", SUNDAY);

        expect(range.start).toEqual(jst(2026, 7, 27));
        expect(range.end).toEqual(jst(2026, 8, 3));
      });

      it("thisMonth の前期間は lastMonth と一致する", () => {
        expect(getPreviousPeriodRange("thisMonth", SUNDAY)).toEqual(
          getPeriodRange("lastMonth", SUNDAY),
        );
      });

      it("lastMonth の前期間は2ヶ月前", () => {
        const range = getPreviousPeriodRange("lastMonth", SUNDAY);

        expect(range.start).toEqual(jst(2026, 6, 1));
        expect(range.end).toEqual(jst(2026, 7, 1));
      });

      it("年をまたぐ2ヶ月前も正しく返す", () => {
        const range = getPreviousPeriodRange("lastMonth", jst(2026, 1, 20));

        expect(range.start).toEqual(jst(2025, 11, 1));
        expect(range.end).toEqual(jst(2025, 12, 1));
      });
    });
  },
);
