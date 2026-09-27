import { describe, expect, it } from "vitest";

import { tocAdIndexAfterSection } from "../toc-ad-position";

describe("tocAdIndexAfterSection", () => {
  it("間隔を 1, 2, 3 と広げ、0・2・5 番目のセクションの後に置く", () => {
    const placed = Array.from({ length: 10 }, (_, i) =>
      tocAdIndexAfterSection(i),
    );
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
