import { describe, it, expect } from "vitest";
import {
  randomBool,
  randomChoice,
  randomFloat,
  randomInt,
  shuffle,
} from "./random";

describe("randomFloat", () => {
  it("0以上1未満の値を返す", () => {
    for (let i = 0; i < 100; i++) {
      const v = randomFloat();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("randomBool", () => {
  it("確率0なら常に false", () => {
    for (let i = 0; i < 50; i++) {
      expect(randomBool(0)).toBe(false);
    }
  });

  it("確率1なら常に true", () => {
    for (let i = 0; i < 50; i++) {
      expect(randomBool(1)).toBe(true);
    }
  });

  it("確率0.5なら両方の結果が出る", () => {
    const results = new Set<boolean>();
    for (let i = 0; i < 200; i++) {
      results.add(randomBool(0.5));
    }
    expect(results.size).toBe(2);
  });
});

describe("randomInt", () => {
  it("min と max が同じなら常にその値", () => {
    for (let i = 0; i < 20; i++) {
      expect(randomInt(5, 5)).toBe(5);
    }
  });

  it("範囲内の値を返す", () => {
    for (let i = 0; i < 100; i++) {
      const v = randomInt(0, 10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it("整数を返す", () => {
    for (let i = 0; i < 50; i++) {
      const v = randomInt(0, 100);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("randomChoice", () => {
  it("配列の要素を返す", () => {
    const arr = [10, 20, 30] as const;
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(randomChoice(arr));
    }
  });

  it("単一要素の配列なら常にその要素", () => {
    for (let i = 0; i < 20; i++) {
      expect(randomChoice([42])).toBe(42);
    }
  });
});

describe("shuffle", () => {
  it("元の配列と同じ長さ", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(arr.length);
  });

  it("同じ要素を含む", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result.sort()).toEqual([...arr].sort());
  });

  it("元の配列を変更しない", () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });

  it("空配列を処理できる", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("単一要素を処理できる", () => {
    expect(shuffle([1])).toEqual([1]);
  });
});
