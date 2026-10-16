import { describe, expect, it } from "vitest";

import { planLineupOf, planNoteKeysOf } from "./plan-lineup";

describe("planLineupOf", () => {
  it("パスと買い切りの両方があれば both", () => {
    expect(
      planLineupOf([
        { key: "pass", productId: "p" },
        { key: "lifetime", productId: "l" },
      ]),
    ).toBe("both");
  });

  it("買い切りだけなら lifetimeOnly", () => {
    expect(planLineupOf([{ key: "lifetime", productId: "l" }])).toBe(
      "lifetimeOnly",
    );
  });

  it("販売していなければ both（従来の文言）", () => {
    expect(planLineupOf([])).toBe("both");
  });
});

describe("planNoteKeysOf", () => {
  it("買い切りだけのときはパスの項目を出さない", () => {
    const keys: readonly string[] = planNoteKeysOf("lifetimeOnly");
    expect(keys).not.toContain("pass");
    expect(keys).not.toContain("noAutoRenew");
    expect(keys).toContain("noAutoRenewLifetimeOnly");
  });

  it("両方のときは従来の項目", () => {
    expect(planNoteKeysOf("both")).toEqual([
      "noAutoRenew",
      "pass",
      "snapshot",
      "noRefund",
      "deletion",
      "appleBilling",
    ]);
  });
});
