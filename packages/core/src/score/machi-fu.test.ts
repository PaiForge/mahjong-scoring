import { describe, expect, it } from "vitest";

import { calculateMachiFu } from "./machi-fu";

describe("calculateMachiFu", () => {
  it("嵌張・辺張・単騎は 2 符、両面・双碰は 0 符", () => {
    expect(calculateMachiFu("Kanchan")).toBe(2);
    expect(calculateMachiFu("Penchan")).toBe(2);
    expect(calculateMachiFu("Tanki")).toBe(2);
    expect(calculateMachiFu("Ryanmen")).toBe(0);
    expect(calculateMachiFu("Shanpon")).toBe(0);
  });
});
