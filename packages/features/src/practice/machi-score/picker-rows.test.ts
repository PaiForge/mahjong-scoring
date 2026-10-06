import { HaiKind } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { MACHI_PICKER_ROWS } from "./picker-rows";

describe("MACHI_PICKER_ROWS", () => {
  it("34 種の牌を重複なく 1 度ずつ並べる", () => {
    const tiles = MACHI_PICKER_ROWS.flatMap((row) => row.tiles);
    expect(tiles).toHaveLength(34);
    expect(new Set(tiles).size).toBe(34);
  });

  it("字牌の行は東から中まで", () => {
    const jihai = MACHI_PICKER_ROWS.find((row) => row.key === "jihai");
    expect(jihai?.tiles[0]).toBe(HaiKind.Ton);
    expect(jihai?.tiles.at(-1)).toBe(HaiKind.Chun);
  });
});
