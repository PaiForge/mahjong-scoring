import { describe, expect, it } from "vitest";

import { getExpForLevel, getLevel, getLevelProgress } from "./level";

// ============================================================
// getExpForLevel
// ============================================================
describe("getExpForLevel", () => {
  it("level 0 は 0", () => {
    expect(getExpForLevel(0)).toBe(0);
  });

  it("level 1 = floor(100 * 1^1.5) = 100", () => {
    expect(getExpForLevel(1)).toBe(100);
  });

  it("level 2 = floor(100 * 2^1.5) = 282", () => {
    expect(getExpForLevel(2)).toBe(282);
  });

  it("level 10 = floor(100 * 10^1.5) = 3162", () => {
    expect(getExpForLevel(10)).toBe(3162);
  });

  it("レベルが上がると必要 EXP も増える", () => {
    for (let i = 1; i <= 20; i++) {
      expect(getExpForLevel(i)).toBeGreaterThan(getExpForLevel(i - 1));
    }
  });
});

// ============================================================
// getLevel
// ============================================================
describe("getLevel", () => {
  it("totalExp 0 はレベル 0", () => {
    expect(getLevel(0)).toBe(0);
  });

  it("totalExp 99 はレベル 0", () => {
    expect(getLevel(99)).toBe(0);
  });

  it("totalExp 100 はレベル 1", () => {
    expect(getLevel(100)).toBe(1);
  });

  it("totalExp 282 はレベル 2", () => {
    expect(getLevel(282)).toBe(2);
  });

  it("totalExp 281 はレベル 1", () => {
    expect(getLevel(281)).toBe(1);
  });

  it("totalExp 283 はレベル 2", () => {
    expect(getLevel(283)).toBe(2);
  });

  it("負の値はレベル 0", () => {
    expect(getLevel(-100)).toBe(0);
  });

  it("getExpForLevel の結果を入力するとそのレベルが返る（逆関数プロパティ）", () => {
    for (let level = 0; level <= 20; level++) {
      const exp = getExpForLevel(level);
      expect(getLevel(exp)).toBe(level);
    }
  });

  it("必要 EXP の 1 つ手前は 1 つ下のレベル", () => {
    for (let level = 1; level <= 20; level++) {
      const exp = getExpForLevel(level);
      expect(getLevel(exp - 1)).toBe(level - 1);
    }
  });
});

// ============================================================
// getLevelProgress
// ============================================================
describe("getLevelProgress", () => {
  it("totalExp 0 の場合", () => {
    const progress = getLevelProgress(0);
    expect(progress.level).toBe(0);
    expect(progress.currentLevelExp).toBe(0);
    expect(progress.nextLevelExp).toBe(100);
    expect(progress.progress).toBe(0);
  });

  it("レベル 1 到達直後（totalExp = 100）", () => {
    const progress = getLevelProgress(100);
    expect(progress.level).toBe(1);
    expect(progress.currentLevelExp).toBe(100);
    expect(progress.nextLevelExp).toBe(282);
    expect(progress.progress).toBe(0);
  });

  it("レベル 1 の中間地点", () => {
    // level 1 = 100, level 2 = 282, 範囲 = 182
    // totalExp 191 -> (191 - 100) / 182 ≈ 0.5
    const progress = getLevelProgress(191);
    expect(progress.level).toBe(1);
    expect(progress.progress).toBeCloseTo(0.5, 1);
  });

  it("progress は 0.0〜1.0 の範囲", () => {
    const progress = getLevelProgress(50);
    expect(progress.progress).toBeGreaterThanOrEqual(0);
    expect(progress.progress).toBeLessThanOrEqual(1);
  });
});

// ============================================================
// 追加: レベル境界のピンポイント検証
// ============================================================
describe("getLevel 境界値", () => {
  const levelsToCheck = [1, 2, 5, 10, 20];

  for (const L of levelsToCheck) {
    it(`level ${L}: expForLevel(L) - 1 → L-1, expForLevel(L) → L, expForLevel(L) + 1 → L`, () => {
      const threshold = getExpForLevel(L);
      expect(getLevel(threshold - 1)).toBe(L - 1);
      expect(getLevel(threshold)).toBe(L);
      expect(getLevel(threshold + 1)).toBe(L);
    });
  }

  it("totalExp = 0 は level 0 start", () => {
    expect(getLevel(0)).toBe(0);
  });

  it("プロパティ: getLevel(expForLevel(L)) === L を L=0..200 で満たす", () => {
    for (let L = 0; L <= 200; L++) {
      const exp = getExpForLevel(L);
      expect(getLevel(exp)).toBe(L);
    }
  });

  it("プロパティ: getLevel(expForLevel(L) - 1) === L - 1 を L=1..200 で満たす", () => {
    for (let L = 1; L <= 200; L++) {
      const exp = getExpForLevel(L);
      expect(getLevel(exp - 1)).toBe(L - 1);
    }
  });
});

describe("getLevelProgress 境界値", () => {
  it("expForLevel(L) ちょうどで progress=0（次レベル直前ではなく現レベル開始）", () => {
    for (const L of [1, 2, 5, 10, 20]) {
      const p = getLevelProgress(getExpForLevel(L));
      expect(p.level).toBe(L);
      expect(p.progress).toBe(0);
    }
  });

  it("プロパティ: progress は常に [0, 1) の範囲（1.0 に到達しない）", () => {
    // レベル境界直前 / 境界 / 中間 / 0 の幅広いサンプルで検査
    const samples: number[] = [0, 1, 50, 99, 100, 101, 281, 282, 283];
    for (let L = 1; L <= 30; L++) {
      const base = getExpForLevel(L);
      const next = getExpForLevel(L + 1);
      samples.push(base, base + 1, base - 1);
      samples.push(Math.floor((base + next) / 2));
      samples.push(next - 1);
    }
    for (const exp of samples) {
      if (exp < 0) continue;
      const p = getLevelProgress(exp);
      expect(p.progress).toBeGreaterThanOrEqual(0);
      expect(p.progress).toBeLessThan(1);
    }
  });

  it("負の totalExp でも progress は 0 以上", () => {
    expect(getLevelProgress(-50).progress).toBeGreaterThanOrEqual(0);
    expect(getLevelProgress(-1).progress).toBeGreaterThanOrEqual(0);
  });

  it("次レベル直前（expForLevel(L+1) - 1）で progress が 1 未満で最大", () => {
    const next = getExpForLevel(6);
    const p = getLevelProgress(next - 1);
    expect(p.level).toBe(5);
    expect(p.progress).toBeGreaterThan(0.9);
    expect(p.progress).toBeLessThan(1);
  });
});
