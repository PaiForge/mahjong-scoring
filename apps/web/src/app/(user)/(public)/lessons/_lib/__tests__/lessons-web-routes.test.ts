import { describe, expect, it } from "vitest";

import { lessonsListHref } from "../lessons-web-routes";

describe("lessonsListHref", () => {
  it("級を渡さなければ全レッスンの目次", () => {
    expect(lessonsListHref()).toBe("/lessons");
  });

  it("級を渡すとその級で絞った目次", () => {
    expect(lessonsListHref("kyu-5")).toBe("/lessons?rank=kyu-5");
  });
});
