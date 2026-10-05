import { describe, expect, it } from "vitest";
import {
  calculateKoScore,
  calculateOyaScore,
  ceilTo100,
  FU_VALUES,
  HIGH_SCORES,
  isInvalidCell,
} from "@mahjong-scoring/core";

import { HAN_COLS } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

import { deriveKoTsumoFromRon } from "../ko-tsumo-halving";

/**
 * 2つの章が同じ言葉で主張していることの検査。
 *
 * 子のロンを半分にして切り上げると親の支払い、もう半分で子の支払いになる。
 * 満貫以上の章（子のツモ）は「端数は出ない」と言い切り、点数記憶術の章は
 * 満貫未満まで含めて「例外なく」と言い切っているため、どちらの範囲も全部見る。
 */
describe("子のロンを半分ずつにすると子ツモになる", () => {
  it("満貫未満でロンとツモが両方ある枠すべてで一致する（例外なし）", () => {
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
   * 満貫以上の章が「この計算で端数は出ない」と書いている根拠。区分の点数は
   * どれも4で割り切れるので、切り上げが一度も効かずに一致する。
   */
  it("満貫以上の区分すべてで一致する（切り上げが効かない）", () => {
    expect(HIGH_SCORES.length).toBeGreaterThan(0);

    for (const row of HIGH_SCORES) {
      expect(deriveKoTsumoFromRon(row.ronKo), row.nameKey).toEqual(row.tsumoKo);
      // 割り切れている（＝切り上げが一度も効いていない）
      expect(row.ronKo % 4, row.nameKey).toBe(0);
    }
  });

  /**
   * 点数記憶術の章が「割る向きなら安全・掛ける向きは危ない」と対比している根拠。
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
