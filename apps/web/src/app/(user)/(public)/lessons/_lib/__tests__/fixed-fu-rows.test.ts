import { describe, expect, it } from "vitest";

import {
  buildFixedFuRows,
  CHIITOITSU_SCORE_TABLE,
  PINFU_SCORE_TABLE,
} from "../fixed-fu-rows";

describe("点数表の形", () => {
  it("七対子は2翻から4翻まで並べる（役だけで2翻あるため1翻は無い）", () => {
    expect(CHIITOITSU_SCORE_TABLE.hanCols).toEqual([2, 3, 4]);
  });

  it("平和は1翻から4翻まで並べる", () => {
    expect(PINFU_SCORE_TABLE.hanCols).toEqual([1, 2, 3, 4]);
  });

  it("七対子はツモ・ロンとも25符", () => {
    expect(CHIITOITSU_SCORE_TABLE.tsumoFu).toBe(25);
    expect(CHIITOITSU_SCORE_TABLE.ronFu).toBe(25);
  });

  it("平和はツモ20符・ロン30符", () => {
    expect(PINFU_SCORE_TABLE.tsumoFu).toBe(20);
    expect(PINFU_SCORE_TABLE.ronFu).toBe(30);
  });
});

describe("buildFixedFuRows: 七対子（25符）", () => {
  it("子のロンは翻数ごとに倍になる", () => {
    const { ron } = buildFixedFuRows("ko", CHIITOITSU_SCORE_TABLE);
    expect(ron).toEqual([
      { han: 2, score: 1600 },
      { han: 3, score: 3200 },
      { han: 4, score: 6400 },
    ]);
  });

  it("2翻ツモは空欄になる（ツモなら門前清自摸和が乗って3翻以上になるため）", () => {
    const { tsumo } = buildFixedFuRows("ko", CHIITOITSU_SCORE_TABLE);
    expect(tsumo[0]).toEqual({ han: 2, score: undefined });
    expect(tsumo[1]?.score).toBeDefined();
  });

  it("親のロンは子の1.5倍", () => {
    const { ron } = buildFixedFuRows("oya", CHIITOITSU_SCORE_TABLE);
    expect(ron.map((cell) => cell.score)).toEqual([2400, 4800, 9600]);
  });
});

describe("buildFixedFuRows: 平和（ツモ20符・ロン30符）", () => {
  it("1翻ツモは空欄になる（ツモなら門前清自摸和が乗って2翻以上になるため）", () => {
    const { tsumo } = buildFixedFuRows("ko", PINFU_SCORE_TABLE);
    expect(tsumo[0]).toEqual({ han: 1, score: undefined });
  });

  it("子のロンは30符で1000点から始まり、4翻で7700点になる", () => {
    const { ron } = buildFixedFuRows("ko", PINFU_SCORE_TABLE);
    expect(ron.map((cell) => cell.score)).toEqual([1000, 2000, 3900, 7700]);
  });

  it("切り上げ満貫は適用しない（親の30符4翻は11600点のまま）", () => {
    const { ron } = buildFixedFuRows("oya", PINFU_SCORE_TABLE);
    expect(ron.at(-1)).toEqual({ han: 4, score: 11600 });
  });

  it("子のツモは20符なので2翻で400/700点", () => {
    const { tsumo } = buildFixedFuRows("ko", PINFU_SCORE_TABLE);
    expect(tsumo[1]?.score).toEqual({
      type: "koTsumo",
      fromKo: 400,
      fromOya: 700,
    });
  });
});
