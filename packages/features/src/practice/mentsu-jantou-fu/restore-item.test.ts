import { describe, expect, it } from "vitest";
import { HaiKind, MentsuType } from "@mahjong-scoring/core";

import { restoreItem } from "./restore-item";

describe("restoreItem", () => {
  it("面子の行は牌と面子を復元し、並び順を id にする", () => {
    const restored = restoreItem(
      {
        tiles: "777z",
        type: MentsuType.Koutsu,
        isOpen: false,
        correctFu: 8,
        userFu: 4,
      },
      2,
    );
    expect(restored.id).toBe("2");
    expect(restored.tiles).toEqual([HaiKind.Chun, HaiKind.Chun, HaiKind.Chun]);
    expect(restored.originalMentsu?.type).toBe(MentsuType.Koutsu);
    expect(restored.correctFu).toBe(8);
    expect(restored.userFu).toBe(4);
  });

  it("雀頭の行は面子を持たない", () => {
    const restored = restoreItem(
      { tiles: "22z", type: "Pair", isOpen: false, correctFu: 0 },
      0,
    );
    expect(restored.originalMentsu).toBeUndefined();
    expect(restored.userFu).toBeUndefined();
  });
});
