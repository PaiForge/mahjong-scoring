import { describe, expect, it } from "vitest";
import { HIGH_SCORES } from "@mahjong-scoring/core";

import { SUPPORTED_LOCALES } from "../i18n/locales";
import { HAN_DISPLAY, hanDisplayFor } from "./han-display";

/**
 * HAN_DISPLAY は core の区分テーブルからの導出に変えたため、
 * 表示文字列が従来の直書きと一致することを固定する。
 */
describe("HAN_DISPLAY", () => {
  it("学習ページの翻数レンジ表示が従来どおり", () => {
    expect(HAN_DISPLAY).toEqual({
      mangan: "4 〜 5",
      haneman: "6 〜 7",
      baiman: "8 〜 10",
      sanbaiman: "11 〜 12",
      yakuman: "13 〜",
    });
  });

  it("HIGH_SCORES の nameKey をすべて網羅する", () => {
    for (const row of HIGH_SCORES) {
      expect(HAN_DISPLAY[row.nameKey], `未定義: ${row.nameKey}`).toBeDefined();
    }
    expect(Object.keys(HAN_DISPLAY)).toHaveLength(HIGH_SCORES.length);
  });

  it("満貫だけ早見表より下限が1翻低い（4翻でも符次第で満貫になるため）", () => {
    // 早見表は "5"、学習ページは "4 〜 5"
    expect(HIGH_SCORES.find((r) => r.nameKey === "mangan")?.han).toBe("5");
    expect(HAN_DISPLAY.mangan).toBe("4 〜 5");
  });

  it("満貫以外は早見表と同じ翻数を指す", () => {
    const toNumbers = (s: string) => s.match(/\d+/g) ?? [];
    for (const row of HIGH_SCORES) {
      if (row.nameKey === "mangan") continue;
      expect(toNumbers(HAN_DISPLAY[row.nameKey]), row.nameKey).toEqual(
        toNumbers(row.han),
      );
    }
  });
});

describe("hanDisplayFor", () => {
  it("日本語は HAN_DISPLAY と同じ値（日本語の表示を変えない）", () => {
    expect(hanDisplayFor("ja")).toEqual(HAN_DISPLAY);
  });

  it("英語は en dash の範囲と上限なしの + で表す", () => {
    expect(hanDisplayFor("en")).toEqual({
      mangan: "4–5",
      haneman: "6–7",
      baiman: "8–10",
      sanbaiman: "11–12",
      yakuman: "13+",
    });
  });

  it.each(SUPPORTED_LOCALES)(
    "%s でも数値は日本語と同じ翻数を指す",
    (locale) => {
      const toNumbers = (s: string) => s.match(/\d+/g) ?? [];
      const display = hanDisplayFor(locale);
      for (const [key, value] of Object.entries(HAN_DISPLAY)) {
        expect(toNumbers(display[key] ?? ""), key).toEqual(toNumbers(value));
      }
    },
  );

  it("英語の表示は数字と en dash と + だけ（全角の記号を残さない）", () => {
    for (const value of Object.values(hanDisplayFor("en"))) {
      expect(value).toMatch(/^[0-9+–]+$/u);
    }
  });
});
