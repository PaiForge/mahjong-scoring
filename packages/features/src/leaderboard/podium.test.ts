import { describe, expect, it } from "vitest";

import { getMedalEmoji } from "./podium";

describe("getMedalEmoji", () => {
  it("1〜3 位に金・銀・銅のメダルを返す", () => {
    expect(getMedalEmoji(1)).toBe("🥇");
    expect(getMedalEmoji(2)).toBe("🥈");
    expect(getMedalEmoji(3)).toBe("🥉");
  });

  it("表彰台の外は undefined", () => {
    expect(getMedalEmoji(4)).toBeUndefined();
    expect(getMedalEmoji(0)).toBeUndefined();
  });
});
