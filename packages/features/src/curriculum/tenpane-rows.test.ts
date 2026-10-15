import { describe, expect, it } from "vitest";

import { buildTenpaneRows } from "./tenpane-rows";

describe("buildTenpaneRows", () => {
  it("門前のロンは30符から足して切り上げる", () => {
    expect(
      buildTenpaneRows("menzen", "ron").map(({ totalFu, fu }) => [totalFu, fu]),
    ).toEqual([
      [32, 40],
      [40, 40],
      [42, 50],
      [62, 70],
    ]);
  });

  it("門前のツモは22符から足して切り上げる", () => {
    expect(
      buildTenpaneRows("menzen", "tsumo").map(({ totalFu, fu }) => [
        totalFu,
        fu,
      ]),
    ).toEqual([
      [24, 30],
      [30, 30],
      [32, 40],
      [38, 40],
    ]);
  });

  it("鳴いた手のロンは門前加符が付かず20符から足して切り上げる", () => {
    expect(
      buildTenpaneRows("furo", "ron").map(({ totalFu, fu }) => [totalFu, fu]),
    ).toEqual([
      [22, 30],
      [30, 30],
      [32, 40],
      [36, 40],
    ]);
  });

  it("鳴いた手のツモは門前と同じ22符から足して切り上げる", () => {
    expect(
      buildTenpaneRows("furo", "tsumo").map(({ totalFu, fu }) => [totalFu, fu]),
    ).toEqual([
      [24, 30],
      [30, 30],
      [32, 40],
      [38, 40],
    ]);
  });
});
