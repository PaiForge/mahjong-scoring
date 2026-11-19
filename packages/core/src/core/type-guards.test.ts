import { describe, it, expect } from "vitest";
import { isHaiKindId, validateHaiKindId } from "./type-guards";

describe("isHaiKindId", () => {
  it("0は有効な牌種ID", () => {
    expect(isHaiKindId(0)).toBe(true);
  });

  it("33は有効な牌種ID", () => {
    expect(isHaiKindId(33)).toBe(true);
  });

  it("中間値は有効", () => {
    expect(isHaiKindId(15)).toBe(true);
    expect(isHaiKindId(27)).toBe(true);
  });

  it("-1は無効", () => {
    expect(isHaiKindId(-1)).toBe(false);
  });

  it("34は無効", () => {
    expect(isHaiKindId(34)).toBe(false);
  });

  it("小数は無効", () => {
    expect(isHaiKindId(1.5)).toBe(false);
  });

  it("NaNは無効", () => {
    expect(isHaiKindId(NaN)).toBe(false);
  });

  it("Infinityは無効", () => {
    expect(isHaiKindId(Infinity)).toBe(false);
  });
});

describe("validateHaiKindId", () => {
  it("範囲内の整数は牌種IDとしてそのまま通る", () => {
    expect(validateHaiKindId(33)._unsafeUnwrap()).toBe(33);
  });

  it("範囲外の値は RangeError で失敗する", () => {
    const result = validateHaiKindId(34);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(RangeError);
  });
});
