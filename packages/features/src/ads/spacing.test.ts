import { describe, expect, it } from "vitest";

import { adIndexAfterGroup } from "./spacing";

describe("adIndexAfterGroup", () => {
  it("間隔を 1, 2, 3 と広げ、0・2・5 番目のまとまりの後に置く", () => {
    const placed = Array.from({ length: 10 }, (_, i) => adIndexAfterGroup(i));
    expect(placed).toEqual([
      0,
      undefined,
      1,
      undefined,
      undefined,
      2,
      undefined,
      undefined,
      undefined,
      3,
    ]);
  });
});
