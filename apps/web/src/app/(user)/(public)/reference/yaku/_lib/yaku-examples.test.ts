import { describe, it, expect } from "vitest";
import { YAKU_HAN_ENTRIES } from "@mahjong-scoring/core";
import { parseTiles } from "./parse-tiles";
import { YAKU_EXAMPLE_NOTATIONS } from "./yaku-examples";

describe("YAKU_EXAMPLE_NOTATIONS", () => {
  it("YAKU_HAN_ENTRIES の全役に例示手牌が定義されている", () => {
    for (const entry of YAKU_HAN_ENTRIES) {
      expect(
        YAKU_EXAMPLE_NOTATIONS[entry.name],
        `例示手牌が未定義: ${entry.name}`,
      ).toBeDefined();
    }
  });

  it("余分な（YAKU_HAN_ENTRIES に存在しない）役が定義されていない", () => {
    const validNames = new Set(YAKU_HAN_ENTRIES.map((e) => e.name));
    for (const name of Object.keys(YAKU_EXAMPLE_NOTATIONS)) {
      expect(validNames.has(name), `未知の役: ${name}`).toBe(true);
    }
  });

  it("全ての例示手牌がパース可能で、枚数が妥当である", () => {
    for (const [name, notation] of Object.entries(YAKU_EXAMPLE_NOTATIONS)) {
      const tiles = parseTiles(notation);

      // 槓子（同一牌4枚）を含む手は 14 枚を超える。それ以外はちょうど 14 枚。
      const counts = new Map<number, number>();
      for (const t of tiles) counts.set(t, (counts.get(t) ?? 0) + 1);
      const hasKan = [...counts.values()].some((c) => c === 4);

      if (hasKan) {
        expect(tiles.length, `${name}: 枚数`).toBeGreaterThan(14);
      } else {
        expect(tiles.length, `${name}: 枚数は14`).toBe(14);
        // 槓が無い手では同一牌は最大3枚
        for (const [, c] of counts) {
          expect(c, `${name}: 同一牌は最大3枚`).toBeLessThanOrEqual(3);
        }
      }
    }
  });
});
