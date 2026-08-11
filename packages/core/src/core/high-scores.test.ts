import { describe, expect, it } from "vitest";

import { HIGH_SCORES } from "./score-calculation";

/**
 * HIGH_SCORES は MANGAN_PLUS_TIERS からの導出に変えたため、
 * 導出結果がリファクタリング前の直書き値と一致することを固定する。
 */
describe("HIGH_SCORES", () => {
  it("満貫〜役満の5帯を翻数の昇順で持つ", () => {
    expect(HIGH_SCORES.map((row) => row.nameKey)).toEqual([
      "mangan",
      "haneman",
      "baiman",
      "sanbaiman",
      "yakuman",
    ]);
  });

  it("翻数レンジ表示が従来どおり", () => {
    expect(HIGH_SCORES.map((row) => row.han)).toEqual([
      "5",
      "6-7",
      "8-10",
      "11-12",
      "13~",
    ]);
  });

  it("点数が従来どおり", () => {
    expect(
      HIGH_SCORES.map((row) => ({
        nameKey: row.nameKey,
        ronKo: row.ronKo,
        tsumoKo: [row.tsumoKo.fromKo, row.tsumoKo.fromOya],
        ronOya: row.ronOya,
        tsumoOya: row.tsumoOya.all,
      })),
    ).toEqual([
      {
        nameKey: "mangan",
        ronKo: 8000,
        tsumoKo: [2000, 4000],
        ronOya: 12000,
        tsumoOya: 4000,
      },
      {
        nameKey: "haneman",
        ronKo: 12000,
        tsumoKo: [3000, 6000],
        ronOya: 18000,
        tsumoOya: 6000,
      },
      {
        nameKey: "baiman",
        ronKo: 16000,
        tsumoKo: [4000, 8000],
        ronOya: 24000,
        tsumoOya: 8000,
      },
      {
        nameKey: "sanbaiman",
        ronKo: 24000,
        tsumoKo: [6000, 12000],
        ronOya: 36000,
        tsumoOya: 12000,
      },
      {
        nameKey: "yakuman",
        ronKo: 32000,
        tsumoKo: [8000, 16000],
        ronOya: 48000,
        tsumoOya: 16000,
      },
    ]);
  });

  it("子ツモの合計はロンと一致する（3人で分け合っているだけ）", () => {
    for (const row of HIGH_SCORES) {
      expect(row.tsumoKo.fromKo * 2 + row.tsumoKo.fromOya).toBe(row.ronKo);
    }
  });

  it("親ツモの合計はロンと一致する", () => {
    for (const row of HIGH_SCORES) {
      expect(row.tsumoOya.all * 3).toBe(row.ronOya);
    }
  });
});
