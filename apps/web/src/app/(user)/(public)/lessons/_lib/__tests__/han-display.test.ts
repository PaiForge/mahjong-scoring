import { describe, expect, it } from "vitest";
import { HIGH_SCORES } from "@mahjong-scoring/core";

import { HAN_DISPLAY } from "../han-display";

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
