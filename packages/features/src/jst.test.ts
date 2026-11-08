import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatJstDateLong,
  formatJstDateTime,
  formatJstDayKeyLong,
  formatJstDayKeyMonthDay,
  jstCalendarDate,
  jstDayKey,
  jstDayStartIso,
  jstStartOfDay,
  jstStartOfMonth,
  parseJstDateTimeLocal,
  toJstDateTimeLocal,
} from "./jst";

describe("jstCalendarDate", () => {
  it("UTC の日付ではなく JST の日付を返す（UTC 15:00 以降は翌日）", () => {
    expect(jstCalendarDate(new Date("2026-08-16T14:59:59Z"))).toEqual({
      year: 2026,
      month: 8,
      day: 16,
      weekday: 0,
    });
    expect(jstCalendarDate(new Date("2026-08-16T15:00:00Z"))).toEqual({
      year: 2026,
      month: 8,
      day: 17,
      weekday: 1,
    });
  });

  it("年末の繰り上がりも JST で判定する", () => {
    expect(jstCalendarDate(new Date("2026-12-31T15:00:00Z"))).toMatchObject({
      year: 2027,
      month: 1,
      day: 1,
    });
  });
});

describe("jstStartOfDay", () => {
  it("JST の 0:00 は UTC の前日 15:00", () => {
    expect(jstStartOfDay(2026, 8, 17).toISOString()).toBe(
      "2026-08-16T15:00:00.000Z",
    );
  });

  it("月・日の範囲外は繰り上がる", () => {
    expect(jstStartOfDay(2026, 13, 1)).toEqual(jstStartOfDay(2027, 1, 1));
    expect(jstStartOfDay(2026, 3, 0)).toEqual(jstStartOfDay(2026, 2, 28));
    expect(jstStartOfDay(2026, 1, -6)).toEqual(jstStartOfDay(2025, 12, 25));
  });

  it("jstCalendarDate と往復できる", () => {
    const now = new Date("2026-10-15T10:00:00Z");
    const { year, month, day } = jstCalendarDate(now);
    const start = jstStartOfDay(year, month, day);
    expect(jstCalendarDate(start)).toMatchObject({ year, month, day });
    expect(jstCalendarDate(new Date(start.getTime() - 1)).day).toBe(day - 1);
  });
});

describe("jstDayKey", () => {
  it("UTC の日付ではなく JST の日付を返す（UTC 15:00 以降は翌日）", () => {
    expect(jstDayKey(new Date("2026-10-01T14:59:59Z"))).toBe("2026-10-01");
    expect(jstDayKey(new Date("2026-10-01T15:00:00Z"))).toBe("2026-10-02");
  });

  it("月末・年末の繰り上がりも JST で判定する", () => {
    expect(jstDayKey(new Date("2026-12-31T15:00:00Z"))).toBe("2027-01-01");
  });
});

describe("jstDayStartIso", () => {
  it("JST の日付の 0:00 を +09:00 付きで返し、jstDayKey で同じ日付に戻る", () => {
    const iso = jstDayStartIso("2026-04-02");
    expect(iso).toBe("2026-04-02T00:00:00+09:00");
    expect(new Date(iso).toISOString()).toBe("2026-04-01T15:00:00.000Z");
    expect(jstDayKey(new Date(iso))).toBe("2026-04-02");
  });
});

describe("jstStartOfMonth", () => {
  it("JST の月の 1 日 0:00（UTC では前日 15:00）を返す", () => {
    expect(
      jstStartOfMonth(new Date("2026-08-15T12:00:00Z")).toISOString(),
    ).toBe("2026-07-31T15:00:00.000Z");
  });

  it("UTC ではまだ前月でも、JST で翌月に入っていれば翌月の月初", () => {
    // JST 2026-09-01 08:30 = UTC 2026-08-31 23:30
    expect(
      jstStartOfMonth(new Date("2026-08-31T23:30:00Z")).toISOString(),
    ).toBe("2026-08-31T15:00:00.000Z");
  });

  it("月初の瞬間そのものはその月に留まり、1 ミリ秒前は前月", () => {
    const start = new Date("2026-08-31T15:00:00.000Z");
    expect(jstStartOfMonth(start)).toEqual(start);
    expect(jstStartOfMonth(new Date(start.getTime() - 1)).toISOString()).toBe(
      "2026-07-31T15:00:00.000Z",
    );
  });

  it("年をまたぐ", () => {
    expect(
      jstStartOfMonth(new Date("2026-12-31T15:00:00Z")).toISOString(),
    ).toBe("2026-12-31T15:00:00.000Z");
  });
});

describe("formatJstDateTime", () => {
  it("JST の「年/月/日 時:分」にする", () => {
    // UTC 23:30 は JST の翌日 08:30
    expect(formatJstDateTime(new Date("2026-10-01T23:30:00Z"))).toBe(
      "2026/10/02 08:30",
    );
  });

  it("深夜 0 時台を 24 時と書かない", () => {
    expect(formatJstDateTime(new Date("2026-10-01T15:05:00Z"))).toBe(
      "2026/10/02 00:05",
    );
  });
});

describe("formatJstDateLong", () => {
  it("JST の「年月日」にする", () => {
    // UTC 15:00 は JST の翌日 0:00
    expect(formatJstDateLong(new Date("2026-10-20T15:00:00Z"))).toBe(
      "2026年10月21日",
    );
  });
});

describe("formatJstDayKeyLong", () => {
  it("日付キーを「年月日」にする（月日は 0 埋めしない）", () => {
    expect(formatJstDayKeyLong("2026-04-02")).toBe("2026年4月2日");
  });
});

describe("表示の関数の言語（locale）", () => {
  // en-US の時刻と AM/PM の間は ICU の版により狭い空白（U+202F）になる。
  // 空白の種類ではなく並びを確かめる
  const normalizeSpaces = (text: string): string => text.replace(/\s/gu, " ");

  it("locale を省くと日本語の出力と同じ（既存の呼び出しが変わらない）", () => {
    const instant = new Date("2026-10-01T23:30:00Z");
    expect(formatJstDateTime(instant)).toBe(formatJstDateTime(instant, "ja"));
    expect(formatJstDateLong(instant)).toBe(formatJstDateLong(instant, "ja"));
    expect(formatJstDayKeyLong("2026-04-02")).toBe(
      formatJstDayKeyLong("2026-04-02", "ja"),
    );
  });

  it("英語の日時は en-US の書式で、時刻は JST のまま", () => {
    // UTC 23:22 は JST の翌日 08:22
    expect(
      normalizeSpaces(
        formatJstDateTime(new Date("2026-09-18T23:22:00Z"), "en"),
      ),
    ).toBe("Sep 19, 2026, 8:22 AM");
  });

  it("英語の日時は午後を PM で書く", () => {
    expect(
      normalizeSpaces(
        formatJstDateTime(new Date("2026-10-02T06:05:00Z"), "en"),
      ),
    ).toBe("Oct 2, 2026, 3:05 PM");
  });

  it("英語の長い日付は「月 日, 年」で、日付は JST で切る", () => {
    // UTC 15:00 は JST の翌日 0:00
    expect(formatJstDateLong(new Date("2026-10-20T15:00:00Z"), "en")).toBe(
      "October 21, 2026",
    );
  });

  it("英語の日付キーの長い形", () => {
    expect(formatJstDayKeyLong("2026-10-02", "en")).toBe("October 2, 2026");
  });
});

describe.each(["Asia/Tokyo", "UTC", "America/Los_Angeles"])(
  "英語の表示（実行環境のタイムゾーンが %s）",
  (tz) => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("英語でも JST の日付で切る", () => {
      vi.stubEnv("TZ", tz);
      expect(formatJstDateLong(new Date("2026-10-01T15:30:00Z"), "en")).toBe(
        "October 2, 2026",
      );
    });
  },
);

describe("formatJstDayKeyMonthDay", () => {
  it("日付キーを「月/日」にする（0 埋めしない）", () => {
    expect(formatJstDayKeyMonthDay("2026-04-02")).toBe("4/2");
    expect(formatJstDayKeyMonthDay("2026-10-31")).toBe("10/31");
  });

  it("日本語を明示しても省略時と同じ従来の文字列", () => {
    expect(formatJstDayKeyMonthDay("2026-10-02", "ja")).toBe("10/2");
    expect(formatJstDayKeyMonthDay("2026-10-02")).toBe("10/2");
  });

  it("英語は en-US の略称の月で「Oct 2」", () => {
    expect(formatJstDayKeyMonthDay("2026-10-02", "en")).toBe("Oct 2");
    expect(formatJstDayKeyMonthDay("2026-12-31", "en")).toBe("Dec 31");
  });
});

describe.each(["Asia/Tokyo", "UTC", "America/Los_Angeles"])(
  "英語の月日（実行環境のタイムゾーンが %s）",
  (tz) => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("実行環境のタイムゾーンに依らず日付キーの日を出す", () => {
      vi.stubEnv("TZ", tz);
      expect(formatJstDayKeyMonthDay("2026-01-01", "en")).toBe("Jan 1");
    });
  },
);

describe.each(["Asia/Tokyo", "UTC", "America/Los_Angeles"])(
  "datetime-local の変換（実行環境のタイムゾーンが %s）",
  (tz) => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    describe("toJstDateTimeLocal", () => {
      it("端末の時刻ではなく JST の壁時計で返す", () => {
        vi.stubEnv("TZ", tz);
        expect(toJstDateTimeLocal(new Date("2026-10-19T10:00:00+09:00"))).toBe(
          "2026-10-19T10:00",
        );
      });

      it("UTC では前日の瞬間も JST の日付で返す", () => {
        vi.stubEnv("TZ", tz);
        expect(toJstDateTimeLocal(new Date("2026-12-31T15:30:00Z"))).toBe(
          "2027-01-01T00:30",
        );
      });

      it("秒以下は切り捨てる", () => {
        vi.stubEnv("TZ", tz);
        expect(
          toJstDateTimeLocal(new Date("2026-10-19T10:00:59.999+09:00")),
        ).toBe("2026-10-19T10:00");
      });
    });

    describe("parseJstDateTimeLocal", () => {
      it("JST の壁時計として読む", () => {
        vi.stubEnv("TZ", tz);
        expect(parseJstDateTimeLocal("2026-10-19T10:00")).toEqual(
          new Date("2026-10-19T10:00:00+09:00"),
        );
      });

      it("JST の 0 時台は UTC の前日の瞬間になる", () => {
        vi.stubEnv("TZ", tz);
        expect(parseJstDateTimeLocal("2027-01-01T00:30")).toEqual(
          new Date("2026-12-31T15:30:00Z"),
        );
      });

      it("秒付きの値も読む", () => {
        vi.stubEnv("TZ", tz);
        expect(parseJstDateTimeLocal("2026-10-19T10:00:30")).toEqual(
          new Date("2026-10-19T10:00:30+09:00"),
        );
      });

      it("toJstDateTimeLocal と往復して同じ瞬間に戻る", () => {
        vi.stubEnv("TZ", tz);
        const instant = new Date("2026-03-08T02:30:00+09:00");
        expect(parseJstDateTimeLocal(toJstDateTimeLocal(instant))).toEqual(
          instant,
        );
      });

      it.each([
        "",
        "2026-10-19",
        "2026-10-19T10:00:00.000Z",
        "2026-10-19T10:00+09:00",
        "2026-02-30T10:00",
        "2026-10-19T24:00",
      ])("形が違う・存在しない日時（%j）は null", (value) => {
        vi.stubEnv("TZ", tz);
        expect(parseJstDateTimeLocal(value)).toBeNull();
      });
    });
  },
);
