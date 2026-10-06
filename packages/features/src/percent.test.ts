import { describe, expect, it } from "vitest";
import { roundedPercent } from "./percent";

describe("roundedPercent", () => {
  it("割合を四捨五入した整数にする", () => {
    expect(roundedPercent(27, 28)).toBe(96);
    expect(roundedPercent(1, 3)).toBe(33);
    expect(roundedPercent(5, 5)).toBe(100);
  });

  it("全体が 0 件なら 0", () => {
    expect(roundedPercent(0, 0)).toBe(0);
  });
});
