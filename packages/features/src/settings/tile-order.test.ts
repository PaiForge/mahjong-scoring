import { describe, expect, it } from "vitest";

import { DEFAULT_TILE_ORDER, normalizeTileOrder } from "./tile-order";

describe("normalizeTileOrder", () => {
  it("unsorted はそのまま", () => {
    expect(normalizeTileOrder("unsorted")).toBe("unsorted");
  });

  it.each([["sorted"], [undefined], [null], ["random"], [1], [true], [{}]])(
    "%s は既定（sorted）に倒す",
    (value) => {
      expect(normalizeTileOrder(value)).toBe(DEFAULT_TILE_ORDER);
      expect(DEFAULT_TILE_ORDER).toBe("sorted");
    },
  );
});
