import { describe, expect, it } from "vitest";

import { buildExpInfo } from "./info";
import { getExpForLevel } from "./level";

describe("buildExpInfo", () => {
  it("付与でレベルの境界を越えたらレベルアップにする", () => {
    const boundary = getExpForLevel(2);
    const info = buildExpInfo({ earned: 10, totalExpAfter: boundary });
    expect(info).toMatchObject({
      earnedExp: 10,
      totalExp: boundary,
      level: 2,
      levelUp: true,
      progressPercent: 0,
    });
  });

  it("同じレベルの中ならレベルアップにしない", () => {
    const info = buildExpInfo({
      earned: 1,
      totalExpAfter: getExpForLevel(2) + 2,
    });
    expect(info.level).toBe(2);
    expect(info.levelUp).toBe(false);
  });

  it("一度に複数のレベルを越えてもレベルアップにする", () => {
    const total = getExpForLevel(5);
    const info = buildExpInfo({ earned: total, totalExpAfter: total });
    expect(info.level).toBe(5);
    expect(info.levelUp).toBe(true);
  });
});
