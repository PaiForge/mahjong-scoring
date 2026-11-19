import { describe, expect, it } from "vitest";

import {
  AGARI_HAI_GAP,
  HAI_SM_HEIGHT,
  HAI_SM_WIDTH,
  REFERENCE_HAND_WIDTH,
} from "./hand-layout";

describe("手牌の寸法", () => {
  it("牌は縦長で、和了牌の間隔は牌 1 枚の幅より狭い", () => {
    expect(HAI_SM_HEIGHT).toBeGreaterThan(HAI_SM_WIDTH);
    expect(AGARI_HAI_GAP).toBeGreaterThan(0);
    expect(AGARI_HAI_GAP).toBeLessThan(HAI_SM_WIDTH);
  });

  it("基準の手の幅は、門前の 13 枚と間隔を空けた和了牌 1 枚の幅", () => {
    expect(REFERENCE_HAND_WIDTH - AGARI_HAI_GAP).toBe(14 * HAI_SM_WIDTH);
  });
});
