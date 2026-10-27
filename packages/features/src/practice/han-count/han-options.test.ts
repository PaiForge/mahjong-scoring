import { describe, expect, it } from "vitest";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";

import { HAN_COUNT_OPTIONS } from "./han-options";

describe("HAN_COUNT_OPTIONS", () => {
  it("1翻から役満までの連番になっている", () => {
    expect(HAN_COUNT_OPTIONS[0]).toBe(1);
    expect(HAN_COUNT_OPTIONS[HAN_COUNT_OPTIONS.length - 1]).toBe(YAKUMAN_HAN);
    expect(HAN_COUNT_OPTIONS).toHaveLength(YAKUMAN_HAN);
  });
});
