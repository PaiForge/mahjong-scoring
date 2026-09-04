import { describe, it, expect } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import { ALL_HAI_KINDS } from "../../core/constants";
import { HaiUsageTracker } from "../../core/hai-tracker";
import { pickAvailableHai } from "./tile-random";

describe("pickAvailableHai", () => {
  it("count 枚使えない牌種は候補にしない", () => {
    const tracker = new HaiUsageTracker();
    // 五筒を 2 枚使うと、刻子（3 枚）には五筒を選べない
    expect(tracker.use(HaiKind.PinZu5, 2).isOk()).toBe(true);

    for (let i = 0; i < 500; i++) {
      expect(pickAvailableHai(new HaiUsageTracker(), 4)).toBeDefined();
      const fresh = new HaiUsageTracker();
      expect(fresh.use(HaiKind.PinZu5, 2).isOk()).toBe(true);
      expect(pickAvailableHai(fresh, 3)).not.toBe(HaiKind.PinZu5);
    }
  });

  it("選んだ牌は count 枚使用登録される", () => {
    const tracker = new HaiUsageTracker();
    const hai = pickAvailableHai(tracker, 4);
    expect(hai).toBeDefined();
    if (hai === undefined) return;
    expect(tracker.canUse(hai, 1)).toBe(false);
  });

  it("候補が無ければ undefined を返す", () => {
    const tracker = new HaiUsageTracker();
    for (const hai of ALL_HAI_KINDS) {
      expect(tracker.use(hai, 4).isOk()).toBe(true);
    }
    expect(pickAvailableHai(tracker, 1)).toBeUndefined();
  });
});
