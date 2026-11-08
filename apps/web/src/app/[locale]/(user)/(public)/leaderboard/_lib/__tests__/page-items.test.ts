import { describe, expect, it } from "vitest";

import { buildPageItems } from "../page-items";

describe("buildPageItems", () => {
  it("7 ページまでは全ページを並べる", () => {
    expect(buildPageItems(1, 1)).toEqual([1]);
    expect(buildPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("先頭付近では末尾側だけを詰める", () => {
    expect(buildPageItems(1, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(buildPageItems(3, 10)).toEqual([1, 2, 3, 4, "ellipsis", 10]);
  });

  it("中ほどでは両側を詰める", () => {
    expect(buildPageItems(5, 10)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      10,
    ]);
  });

  it("末尾付近では先頭側だけを詰める", () => {
    expect(buildPageItems(8, 10)).toEqual([1, "ellipsis", 7, 8, 9, 10]);
    expect(buildPageItems(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  });
});
