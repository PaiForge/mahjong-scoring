import { describe, expect, it } from "vitest";

import { getPeriodRange, getPreviousPeriodRange } from "./period-utils";

/**
 * ローカルタイムゾーンの日付を組み立てる。
 * 実装が `new Date(y, m, d)`（ローカル基準）で範囲を作るため、
 * 期待値も同じ基準で組み立てて実行環境の TZ に依存しないようにする。
 */
function local(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0,
): Date {
  return new Date(year, month - 1, day, hours, minutes, seconds, ms);
}

/** 2026-08-16 は日曜日（その週の月曜は 8/10） */
const SUNDAY = local(2026, 8, 16, 13, 45);

describe("getPeriodRange", () => {
  it("thisWeek は月曜始まり・日曜終わりで、日曜を週の末日として扱う", () => {
    const range = getPeriodRange("thisWeek", SUNDAY);

    expect(range.start).toEqual(local(2026, 8, 10));
    expect(range.end).toEqual(local(2026, 8, 16, 23, 59, 59, 999));
  });

  it("thisWeek は月をまたぐ週も正しく返す", () => {
    // 2026-09-02 は水曜日。その週の月曜は 8/31。
    const range = getPeriodRange("thisWeek", local(2026, 9, 2));

    expect(range.start).toEqual(local(2026, 8, 31));
    expect(range.end).toEqual(local(2026, 9, 6, 23, 59, 59, 999));
  });

  it("lastWeek は今週の1週前（月曜〜日曜）", () => {
    const range = getPeriodRange("lastWeek", SUNDAY);

    expect(range.start).toEqual(local(2026, 8, 3));
    expect(range.end).toEqual(local(2026, 8, 9, 23, 59, 59, 999));
  });

  it("thisMonth は月初から月末まで", () => {
    const range = getPeriodRange("thisMonth", SUNDAY);

    expect(range.start).toEqual(local(2026, 8, 1));
    expect(range.end).toEqual(local(2026, 8, 31, 23, 59, 59, 999));
  });

  it("lastMonth は前月の月初から月末まで（30日月も末日を返す）", () => {
    const range = getPeriodRange("lastMonth", local(2026, 7, 5));

    expect(range.start).toEqual(local(2026, 6, 1));
    expect(range.end).toEqual(local(2026, 6, 30, 23, 59, 59, 999));
  });

  it("年をまたぐ lastMonth も正しく返す", () => {
    const range = getPeriodRange("lastMonth", local(2026, 1, 20));

    expect(range.start).toEqual(local(2025, 12, 1));
    expect(range.end).toEqual(local(2025, 12, 31, 23, 59, 59, 999));
  });

  it("時刻を含む now を渡しても日付境界に丸められる", () => {
    const range = getPeriodRange("thisMonth", local(2026, 8, 16, 23, 59, 59));

    expect(range.start).toEqual(local(2026, 8, 1));
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

    expect(range.start).toEqual(local(2026, 7, 27));
    expect(range.end).toEqual(local(2026, 8, 2, 23, 59, 59, 999));
  });

  it("thisMonth の前期間は lastMonth と一致する", () => {
    expect(getPreviousPeriodRange("thisMonth", SUNDAY)).toEqual(
      getPeriodRange("lastMonth", SUNDAY),
    );
  });

  it("lastMonth の前期間は2ヶ月前", () => {
    const range = getPreviousPeriodRange("lastMonth", SUNDAY);

    expect(range.start).toEqual(local(2026, 6, 1));
    expect(range.end).toEqual(local(2026, 6, 30, 23, 59, 59, 999));
  });
});
