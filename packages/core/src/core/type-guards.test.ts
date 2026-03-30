import { describe, it, expect } from "vitest";
import { isHaiKindId } from "./type-guards";

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
