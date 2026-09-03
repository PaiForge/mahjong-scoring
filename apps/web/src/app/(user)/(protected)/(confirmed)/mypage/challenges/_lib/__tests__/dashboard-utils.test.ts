import { describe, expect, it } from "vitest";

import { getNavigablePreviousPeriod } from "../dashboard-utils";

describe("getNavigablePreviousPeriod", () => {
  it("今週からは先週へ遷移できる", () => {
    expect(getNavigablePreviousPeriod("thisWeek")).toBe("lastWeek");
  });

  it("今月からは先月へ遷移できる", () => {
    expect(getNavigablePreviousPeriod("thisMonth")).toBe("lastMonth");
  });

  // 先週・先月のさらに前は期間選択に無いため、凡例をクリックしても遷移しない
  it("先週からは遷移しない", () => {
    expect(getNavigablePreviousPeriod("lastWeek")).toBeUndefined();
  });

  it("先月からは遷移しない", () => {
    expect(getNavigablePreviousPeriod("lastMonth")).toBeUndefined();
  });
});
