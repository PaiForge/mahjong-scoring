import { describe, expect, it } from "vitest";

import { PAGE_SIZE } from "../types";

describe("PAGE_SIZE", () => {
  it("is 20", () => {
    expect(PAGE_SIZE).toBe(20);
  });
});
