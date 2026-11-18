import { describe, expect, it } from "vitest";

import { retryGenerate } from "./retry-generate";

/** 決めた回数だけ undefined を返し、その後は試行回数を返す生成関数 */
function failingTimes(failures: number): {
  generator: () => number | undefined;
  calls: () => number;
} {
  let count = 0;
  return {
    generator: () => {
      count += 1;
      return count > failures ? count : undefined;
    },
    calls: () => count,
  };
}

describe("retryGenerate", () => {
  it("最初の試行で生成できればその値を返し、それ以上呼ばない", () => {
    const { generator, calls } = failingTimes(0);
    expect(retryGenerate(generator, 3)).toBe(1);
    expect(calls()).toBe(1);
  });

  it("失敗が続いても上限の回数目で生成できればその値を返す", () => {
    const { generator, calls } = failingTimes(2);
    expect(retryGenerate(generator, 3)).toBe(3);
    expect(calls()).toBe(3);
  });

  it("上限の回数まで失敗したら undefined を返し、上限を超えて呼ばない", () => {
    const { generator, calls } = failingTimes(3);
    expect(retryGenerate(generator, 3)).toBeUndefined();
    expect(calls()).toBe(3);
  });

  it("上限を省略すると 10 回まで試す", () => {
    const succeedsAtTenth = failingTimes(9);
    expect(retryGenerate(succeedsAtTenth.generator)).toBe(10);

    const neverWithinTen = failingTimes(10);
    expect(retryGenerate(neverWithinTen.generator)).toBeUndefined();
    expect(neverWithinTen.calls()).toBe(10);
  });

  it("falsy でも undefined でない値は生成できたものとして返す", () => {
    let count = 0;
    const result = retryGenerate(() => {
      count += 1;
      return 0;
    }, 3);
    expect(result).toBe(0);
    expect(count).toBe(1);
  });
});
