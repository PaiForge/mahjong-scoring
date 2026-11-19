import { describe, expect, it } from "vitest";

import { pickTotalFuBand } from "./range";

describe("pickTotalFuBand", () => {
  it("up-to-40 と all は抽選に依らず、20符からその範囲の上限までの帯になる", () => {
    for (const draw of [0, 0.99]) {
      expect(pickTotalFuBand("up-to-40", () => draw)).toEqual({
        min: 20,
        max: 40,
      });
      expect(pickTotalFuBand("all", () => draw)).toEqual({
        min: 20,
        max: 110,
      });
    }
  });

  it("up-to-60 は抽選で 50・60符の帯か 40符までの帯のどちらかになる", () => {
    expect(pickTotalFuBand("up-to-60", () => 0)).toEqual({ min: 50, max: 60 });
    expect(pickTotalFuBand("up-to-60", () => 0.99)).toEqual({
      min: 20,
      max: 40,
    });
  });
});
