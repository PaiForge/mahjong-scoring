import { describe, expect, it } from "vitest";

import { isBelowMinimumVersion, parseAppVersion } from "./version";

describe("parseAppVersion", () => {
  it("足りない桁を 0 で埋める", () => {
    expect(parseAppVersion("1")).toEqual([1, 0, 0]);
    expect(parseAppVersion("1.2")).toEqual([1, 2, 0]);
    expect(parseAppVersion("1.2.3")).toEqual([1, 2, 3]);
  });

  it("形の違う値は読まない", () => {
    for (const value of ["", "1.2.3.4", "v1.0.0", "1.0.0-beta", "1..0", " 1"]) {
      expect(parseAppVersion(value)).toBeUndefined();
    }
  });
});

describe("isBelowMinimumVersion", () => {
  it("桁ごとに数として比べる", () => {
    expect(isBelowMinimumVersion("1.0.0", "1.0.1")).toBe(true);
    expect(isBelowMinimumVersion("1.9.0", "1.10.0")).toBe(true);
    expect(isBelowMinimumVersion("1.10.0", "1.9.0")).toBe(false);
    expect(isBelowMinimumVersion("2.0.0", "1.99.99")).toBe(false);
  });

  it("同じ版は下回らない（桁の数が違っても）", () => {
    expect(isBelowMinimumVersion("1.2.0", "1.2.0")).toBe(false);
    expect(isBelowMinimumVersion("1.2", "1.2.0")).toBe(false);
  });

  it("どちらかが読めなければ止めない", () => {
    expect(isBelowMinimumVersion("1.0.0", "next")).toBe(false);
    expect(isBelowMinimumVersion("unknown", "9.0.0")).toBe(false);
  });
});
