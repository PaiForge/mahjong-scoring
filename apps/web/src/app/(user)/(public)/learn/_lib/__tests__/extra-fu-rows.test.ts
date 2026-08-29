import { describe, expect, it } from "vitest";

import { buildExtraFuRows } from "../extra-fu-rows";

describe("buildExtraFuRows", () => {
  it("門前手: 符が同じ並びを1行にまとめる", () => {
    expect(buildExtraFuRows(true)).toEqual([
      { from: 2, to: 8, tsumoFu: 30, ronFu: 40 },
      { from: 10, to: 10, tsumoFu: 40, ronFu: 40 },
      { from: 12, to: 18, tsumoFu: 40, ronFu: 50 },
      { from: 20, to: 20, tsumoFu: 50, ronFu: 50 },
      { from: 22, to: 28, tsumoFu: 50, ronFu: 60 },
    ]);
  });

  it("門前手は積み上げ0符（平和）を含めない", () => {
    expect(buildExtraFuRows(true).every((row) => row.from >= 2)).toBe(true);
  });

  it("副露した手: ロンは門前より10符低く、ツモが上回ることがある", () => {
    expect(buildExtraFuRows(false)).toEqual([
      { from: 0, to: 8, tsumoFu: 30, ronFu: 30 },
      { from: 10, to: 10, tsumoFu: 40, ronFu: 30 },
      { from: 12, to: 18, tsumoFu: 40, ronFu: 40 },
      { from: 20, to: 20, tsumoFu: 50, ronFu: 40 },
      { from: 22, to: 28, tsumoFu: 50, ronFu: 50 },
    ]);
  });
});
