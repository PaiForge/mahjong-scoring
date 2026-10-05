import { describe, expect, it } from "vitest";

import { buildScoreGrid, scoreGridKey } from "./score-grid";

describe("buildScoreGrid", () => {
  it("子のロンは 30 符 1 翻が 1000 点", () => {
    const grid = buildScoreGrid("ko", "ron", { kiriageMangan: false });
    expect(grid.get(scoreGridKey(1, 30))).toMatchObject({ ron: 1000 });
  });

  it("ロンの 20 符は存在しないのでグリッドに無い", () => {
    const grid = buildScoreGrid("oya", "ron", { kiriageMangan: false });
    expect(grid.has(scoreGridKey(2, 20))).toBe(false);
  });

  it("切り上げ満貫は 30 符 4 翻を満貫にする", () => {
    const off = buildScoreGrid("ko", "ron", { kiriageMangan: false });
    const on = buildScoreGrid("ko", "ron", { kiriageMangan: true });
    expect(off.get(scoreGridKey(4, 30))).toMatchObject({ ron: 7700 });
    expect(on.get(scoreGridKey(4, 30))).toMatchObject({ ron: 8000 });
  });
});
