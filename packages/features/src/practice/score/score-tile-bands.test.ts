import { describe, expect, it } from "vitest";

import { getAvailableScores } from "./get-available-scores";
import type { SingleInputScores } from "./get-available-scores";
import { resolveScoreTileBands } from "./score-tile-bands";

/** 子ロン・全範囲（満貫未満 20・満貫以上 10） */
function koRonAll(): SingleInputScores {
  const available = getAvailableScores({
    han: undefined,
    isOya: false,
    isTsumo: false,
    scoreRange: "all",
  });
  if (available.type !== "single") throw new Error("single を期待");
  return available;
}

describe("resolveScoreTileBands", () => {
  it("両側に選択肢があれば切り替えを出し、初めは満貫未満を開く", () => {
    const bands = resolveScoreTileBands({
      available: koRonAll(),
      isOya: false,
      isTsumo: false,
      value: undefined,
      chosenBand: undefined,
    });

    expect(bands.hasBoth).toBe(true);
    expect(bands.band).toBe("nonMangan");
    expect(bands.options.nonMangan.map((o) => o.value)).toContain("7700");
    expect(bands.options.manganPlus.map((o) => o.value)).toContain("8000");
    expect(bands.hiddenSelection).toBeUndefined();
    // 4 列。多いほうの帯（満貫未満 20 個）の行数を確保する
    expect(bands.columns).toBe(4);
    expect(bands.rows).toBe(5);
  });

  it("選択済みの値があればその側を開き、利用者の切り替えが優先する", () => {
    const base = {
      available: koRonAll(),
      isOya: false,
      isTsumo: false,
      value: "8000",
    };

    expect(resolveScoreTileBands({ ...base, chosenBand: undefined }).band).toBe(
      "manganPlus",
    );
    const switched = resolveScoreTileBands({
      ...base,
      chosenBand: "nonMangan",
    });
    expect(switched.band).toBe("nonMangan");
    expect(switched.hiddenSelection).toEqual({
      band: "manganPlus",
      label: "8000",
    });
  });

  it("選択肢が片側にしか無ければ切り替えを出さず、その側の行数だけ確保する", () => {
    const available = getAvailableScores({
      han: 5,
      isOya: false,
      isTsumo: false,
    });
    if (available.type !== "single") throw new Error("single を期待");

    const bands = resolveScoreTileBands({
      available,
      isOya: false,
      isTsumo: false,
      value: undefined,
      chosenBand: undefined,
    });

    expect(bands.hasBoth).toBe(false);
    expect(bands.band).toBe("manganPlus");
    expect(bands.options.nonMangan).toHaveLength(0);
    expect(bands.rows).toBe(Math.ceil(bands.options.manganPlus.length / 4));
  });

  it("子ツモの組は 3 列で、2000/3900 は満貫未満に入る", () => {
    const available = getAvailableScores({
      han: undefined,
      isOya: false,
      isTsumo: true,
      scoreRange: "all",
      koTsumoInput: "combined",
    });
    if (available.type !== "koTsumoCombined")
      throw new Error("koTsumoCombined を期待");

    const bands = resolveScoreTileBands({
      available,
      isOya: false,
      isTsumo: true,
      value: undefined,
      chosenBand: undefined,
    });

    expect(bands.columns).toBe(3);
    expect(bands.options.nonMangan.map((o) => o.label)).toContain("2000/3900");
    expect(bands.options.manganPlus.map((o) => o.label)).toContain("2000/4000");
  });

  it("親ツモは後置文字列を文言にだけ添える", () => {
    const available = getAvailableScores({
      han: 1,
      isOya: true,
      isTsumo: true,
    });
    if (available.type !== "single") throw new Error("single を期待");

    const bands = resolveScoreTileBands({
      available,
      isOya: true,
      isTsumo: true,
      value: "500",
      chosenBand: undefined,
      suffix: "オール",
    });

    expect(bands.options.nonMangan[0]).toEqual({
      value: "500",
      label: "500オール",
    });
  });
});
