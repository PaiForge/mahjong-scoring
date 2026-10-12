import { describe, expect, it } from "vitest";

import { sumYakuHan } from "./yaku-han";

describe("sumYakuHan", () => {
  it("内訳の翻数を足す", () => {
    expect(
      sumYakuHan([
        { name: "立直", han: 1 },
        { name: "ドラ", han: 2 },
      ]),
    ).toBe(3);
  });

  it("内訳が無ければ 0", () => {
    expect(sumYakuHan([])).toBe(0);
  });
});
