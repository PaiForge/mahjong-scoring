import { describe, it, expect } from "vitest";
import { HaiKind, type HaiKindId } from "@pai-forge/riichi-mahjong";
import { HaiUsageTracker } from "./hai-tracker";

describe("HaiUsageTracker", () => {
  it("初期状態では全牌種を使用可能", () => {
    const tracker = new HaiUsageTracker();
    for (let i = 0; i <= 33; i++) {
      expect(tracker.canUse(i as HaiKindId)).toBe(true);
    }
  });

  it("1枚使用すると残り3枚使用可能", () => {
    const tracker = new HaiUsageTracker();
    expect(tracker.use(HaiKind.ManZu1).isOk()).toBe(true);
    expect(tracker.canUse(HaiKind.ManZu1, 3)).toBe(true);
    expect(tracker.canUse(HaiKind.ManZu1, 4)).toBe(false);
  });

  it("4枚使用すると追加使用不可", () => {
    const tracker = new HaiUsageTracker();
    expect(tracker.use(HaiKind.Ton, 4).isOk()).toBe(true);
    expect(tracker.canUse(HaiKind.Ton)).toBe(false);
  });

  it("5枚以上の使用は失敗する", () => {
    const tracker = new HaiUsageTracker();
    expect(tracker.use(HaiKind.Haku, 5).isErr()).toBe(true);
  });

  it("上限超過の使用は状態を変更しない", () => {
    const tracker = new HaiUsageTracker();
    tracker.use(HaiKind.Chun, 3);
    expect(tracker.use(HaiKind.Chun, 2).isErr()).toBe(true);
    // 3枚のまま（Errで変わっていない）→ あと1枚使用可能
    expect(tracker.canUse(HaiKind.Chun, 1)).toBe(true);
  });

  it("異なる牌種は独立して追跡される", () => {
    const tracker = new HaiUsageTracker();
    tracker.use(HaiKind.ManZu1, 4);
    expect(tracker.canUse(HaiKind.ManZu1)).toBe(false);
    expect(tracker.canUse(HaiKind.ManZu2)).toBe(true);
  });

  it("複数回の使用で累積される", () => {
    const tracker = new HaiUsageTracker();
    expect(tracker.use(HaiKind.PinZu5, 2).isOk()).toBe(true);
    expect(tracker.use(HaiKind.PinZu5, 2).isOk()).toBe(true);
    expect(tracker.canUse(HaiKind.PinZu5)).toBe(false);
  });

  it("canUse はデフォルトで count=1 を使用する", () => {
    const tracker = new HaiUsageTracker();
    tracker.use(HaiKind.SouZu9, 4);
    expect(tracker.canUse(HaiKind.SouZu9)).toBe(false);
  });

  it("use はデフォルトで count=1 を使用する", () => {
    const tracker = new HaiUsageTracker();
    tracker.use(HaiKind.Hatsu);
    tracker.use(HaiKind.Hatsu);
    tracker.use(HaiKind.Hatsu);
    tracker.use(HaiKind.Hatsu);
    expect(tracker.canUse(HaiKind.Hatsu)).toBe(false);
  });

  it("count=0 は常に使用可能（何も消費しない）", () => {
    const tracker = new HaiUsageTracker();
    tracker.use(HaiKind.Nan, 4);
    expect(tracker.canUse(HaiKind.Nan, 0)).toBe(true);
  });
});
