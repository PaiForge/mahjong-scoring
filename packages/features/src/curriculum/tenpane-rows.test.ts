import { describe, expect, it } from "vitest";

import { buildTenpaneRows } from "./tenpane-rows";

describe("buildTenpaneRows", () => {
  it("ロンは30符から足して切り上げる", () => {
    expect(
      buildTenpaneRows("ron").map(({ totalFu, fu }) => [totalFu, fu]),
    ).toEqual([
      [32, 40],
      [40, 40],
      [42, 50],
      [62, 70],
    ]);
  });

  it("ツモは22符から足して切り上げる", () => {
    expect(
      buildTenpaneRows("tsumo").map(({ totalFu, fu }) => [totalFu, fu]),
    ).toEqual([
      [24, 30],
      [30, 30],
      [32, 40],
      [38, 40],
    ]);
  });
});
