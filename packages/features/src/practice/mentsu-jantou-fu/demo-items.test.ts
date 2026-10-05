import { describe, expect, it } from "vitest";

import { MENTSU_JANTOU_FU_DEMO_AGARI_HIGHLIGHT } from "./demo-items";

describe("MENTSU_JANTOU_FU_DEMO_AGARI_HIGHLIGHT", () => {
  it("デモの和了牌（七筒）を 567p の右端に示す", () => {
    expect(MENTSU_JANTOU_FU_DEMO_AGARI_HIGHLIGHT).toEqual({
      itemId: "567p",
      tileIndex: 2,
    });
  });
});
