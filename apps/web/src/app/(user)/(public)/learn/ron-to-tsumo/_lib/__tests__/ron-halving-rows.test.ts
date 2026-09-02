import { describe, expect, it } from "vitest";
import {
  calculateKoScore,
  calculateOyaScore,
  ceilTo100,
  FU_VALUES,
  isInvalidCell,
} from "@mahjong-scoring/core";

import { HAN_COLS } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

import { buildRonHalvingRows, deriveKoTsumoFromRon } from "../ron-halving-rows";

/**
 * この章の主張そのものの検査。
 *
 * 子のロンを半分にして切り上げると親の支払い、もう半分で子の支払いになる。
 * 章は「例外なく」と言い切っているため、ロンとツモが両方ある枠を全部見る。
 */
describe("子のロンを半分ずつにすると子ツモになる", () => {
  it("ロンとツモが両方ある枠すべてで一致する（例外なし）", () => {
    let checked = 0;

    for (const fu of FU_VALUES) {
      for (const han of HAN_COLS) {
        if (isInvalidCell(han, fu, "ron")) continue;
        if (isInvalidCell(han, fu, "tsumo")) continue;

        const { ron, tsumo } = calculateKoScore(han, fu);
        expect(deriveKoTsumoFromRon(ron)).toEqual(tsumo);
        checked += 1;
      }
    }

    // 枠を1つも見ずに素通りしていないことを確かめる
    expect(checked).toBe(38);
  });

  /**
   * 章が「割る向きなら安全・掛ける向きは危ない」と対比している根拠。
   * 同じ理屈に見える「親のロン ＝ 子のロンの1.5倍」は、端数が縮まずに
   * 広がるため成り立たない。9つの枠で100点ずれる。
   */
  it("掛ける向き（親ロン＝子ロンの1.5倍）は成り立たない", () => {
    const broken: string[] = [];

    for (const fu of FU_VALUES) {
      for (const han of HAN_COLS) {
        if (isInvalidCell(han, fu, "ron")) continue;

        const koRon = calculateKoScore(han, fu).ron;
        const oyaRon = calculateOyaScore(han, fu).ron;
        if (ceilTo100(koRon * 1.5) !== oyaRon) broken.push(`${fu}符${han}翻`);
      }
    }

    expect(broken).toHaveLength(9);
    // 章がコラムで名指ししている例
    expect(broken).toContain("70符1翻");
  });
});

describe("deriveKoTsumoFromRon", () => {
  it("端数が2回とも出る例を通す（70符1翻の 2300 → 600 / 1200）", () => {
    expect(deriveKoTsumoFromRon(2300)).toEqual({
      type: "koTsumo",
      fromKo: 600,
      fromOya: 1200,
    });
  });

  it("満貫の 8000 は 2000 / 4000 になる", () => {
    expect(deriveKoTsumoFromRon(8000)).toEqual({
      type: "koTsumo",
      fromKo: 2000,
      fromOya: 4000,
    });
  });
});

describe("buildRonHalvingRows", () => {
  it("30符は 1000 / 2000 / 3900 / 7700 から始まる", () => {
    expect(buildRonHalvingRows(30).map((row) => row.ron)).toEqual([
      1000, 2000, 3900, 7700,
    ]);
  });

  it("導いた支払いと実際の支払いが並ぶ（30符4翻の 2000 / 3900）", () => {
    const row = buildRonHalvingRows(30).find((r) => r.han === 4);
    expect(row?.derived).toEqual({
      type: "koTsumo",
      fromKo: 2000,
      fromOya: 3900,
    });
    expect(row?.derived).toEqual(row?.actual);
  });

  it("ロンの欄が無い符は行ごと落とす（20符）", () => {
    expect(buildRonHalvingRows(20)).toEqual([]);
  });

  it("ツモの欄が無い組も行ごと落とす（25符2翻）", () => {
    expect(buildRonHalvingRows(25).map((row) => row.han)).toEqual([3, 4]);
  });
});
