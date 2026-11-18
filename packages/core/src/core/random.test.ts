import { describe, it, expect } from "vitest";
import {
  mulberry32,
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

describe("mulberry32", () => {
  // 期待値は公開されている mulberry32 の参照実装（bryc）で求めた数列。
  // 数列が変わると、シードで固定したテストや開発用シードの結果が黙って入れ替わる
  it("参照実装と同じ数列を返す", () => {
    const rng = mulberry32(1);
    expect(rng()).toBe(0.6270739405881613);
    expect(rng()).toBe(0.002735721180215478);
    expect(rng()).toBe(0.5274470399599522);
  });

  it("同じシードなら同じ数列、違うシードなら違う数列になる", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const c = mulberry32(43);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect([c(), c(), c()]).not.toEqual(first);
  });
});

describe("RandomSource の注入", () => {
  /** 与えた数列を順に返す供給源（尽きたら先頭へ戻る） */
  function sequence(values: readonly number[]): () => number {
    let i = 0;
    return () => values[i++ % values.length];
  }

  it("randomFloat は注入した供給源の値をそのまま返す", () => {
    const rng = sequence([0.1, 0.9]);
    expect(randomFloat(rng)).toBe(0.1);
    expect(randomFloat(rng)).toBe(0.9);
  });

  it("randomInt は供給源が同じなら同じ値を返す", () => {
    expect(randomInt(0, 9, () => 0)).toBe(0);
    expect(randomInt(0, 9, () => 0.99)).toBe(9);
    expect(randomInt(5, 5, () => 0.5)).toBe(5);
  });

  it("randomBool は供給源の値と閾値の比較だけで決まる", () => {
    expect(randomBool(0.5, () => 0.49)).toBe(true);
    expect(randomBool(0.5, () => 0.5)).toBe(false);
  });

  it("randomChoice は供給源が同じなら同じ要素を選ぶ", () => {
    const arr = ["a", "b", "c", "d"] as const;
    expect(randomChoice(arr, () => 0)).toBe("a");
    expect(randomChoice(arr, () => 0.99)).toBe("d");
  });

  it("shuffle は同じ供給源なら同じ並びを返す（決定論的）", () => {
    const arr = [1, 2, 3, 4, 5];
    const first = shuffle(arr, sequence([0.1, 0.7, 0.3, 0.9]));
    const second = shuffle(arr, sequence([0.1, 0.7, 0.3, 0.9]));

    expect(first).toEqual(second);
    expect([...first].sort()).toEqual(arr);
  });

  it("shuffle は乱数が常に 0 なら末尾から順に先頭と入れ替える（Fisher-Yates）", () => {
    // i=2: [1,2,3] → [3,2,1]、i=1: [3,2,1] → [2,3,1]
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
  });

  // 供給源を共有するジェネレータでは、引いた回数が後続の抽選の結果を決める。
  // 自分自身との入れ替えにしかならない最後の 1 要素では引かない
  it("shuffle は n 要素に対して乱数を n-1 回だけ引く", () => {
    let draws = 0;
    shuffle([1, 2, 3, 4], () => {
      draws++;
      return 0.5;
    });
    expect(draws).toBe(3);
  });

  it("既定の供給源は Math.random（引数なしでも動く）", () => {
    const v = randomFloat();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });
});
