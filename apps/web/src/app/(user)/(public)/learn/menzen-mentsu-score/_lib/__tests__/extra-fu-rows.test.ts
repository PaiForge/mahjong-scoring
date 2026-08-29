import { describe, expect, it } from "vitest";

import { buildExtraFuRows } from "../extra-fu-rows";

describe("buildExtraFuRows", () => {
  it("符が同じ並びを1行にまとめる", () => {
    expect(buildExtraFuRows()).toEqual([
      { from: 2, to: 8, tsumoFu: 30, ronFu: 40 },
      { from: 10, to: 10, tsumoFu: 40, ronFu: 40 },
      { from: 12, to: 18, tsumoFu: 40, ronFu: 50 },
      { from: 20, to: 20, tsumoFu: 50, ronFu: 50 },
      { from: 22, to: 28, tsumoFu: 50, ronFu: 60 },
    ]);
  });

  it("積み上げ0符（平和）は含めない", () => {
    expect(buildExtraFuRows().every((row) => row.from >= 2)).toBe(true);
  });
});
