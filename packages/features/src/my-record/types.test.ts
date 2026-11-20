import { describe, expect, it } from "vitest";

import { messages } from "@mahjong-scoring/messages/ja";

import { getPeriodRange } from "./period";
import { DATE_PERIOD_VALUES, isDatePeriod } from "./types";

describe("DATE_PERIOD_VALUES", () => {
  it("期間の選択肢は 1 つ以上あって重複せず、どれも期間選択の辞書にラベルがある", () => {
    expect(DATE_PERIOD_VALUES.length).toBeGreaterThan(0);
    expect(new Set(DATE_PERIOD_VALUES).size).toBe(DATE_PERIOD_VALUES.length);
    for (const period of DATE_PERIOD_VALUES) {
      expect(messages.mypage.challenges.periods[period]).toEqual(
        expect.any(String),
      );
    }
  });

  it("どの選択肢も範囲を引ける", () => {
    const now = new Date("2026-08-16T13:45:00+09:00");
    for (const period of DATE_PERIOD_VALUES) {
      const range = getPeriodRange(period, now);
      expect(range.start.getTime()).toBeLessThan(range.end.getTime());
    }
  });
});

describe("isDatePeriod", () => {
  it.each(DATE_PERIOD_VALUES)("選択肢の %s は期間として通す", (period) => {
    expect(isDatePeriod(period)).toBe(true);
  });

  it.each([
    ["選択肢に無い文字列", "lastYear"],
    ["空文字", ""],
    ["大文字違い", "ThisWeek"],
    ["文字列でない値", 0],
    ["undefined", undefined],
    ["null", null],
  ])("%s は期間として通さない", (_label, value) => {
    expect(isDatePeriod(value)).toBe(false);
  });
});
