import { describe, expect, it } from "vitest";

import { buildRonHalvingRows } from "../ron-halving-rows";

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
