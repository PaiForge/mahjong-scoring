import { describe, expect, it } from "vitest";
import { isNavItemActive } from "./nav-items";

describe("isNavItemActive", () => {
  it("ホームは / のときだけ選択中にする", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/practice", "/")).toBe(false);
  });

  it("配下のパスでも選択中にする", () => {
    expect(isNavItemActive("/dojo", "/dojo")).toBe(true);
    expect(isNavItemActive("/dojo/ranks/kyu5", "/dojo")).toBe(true);
  });

  it("接頭辞が同じだけの別のパスは選択中にしない", () => {
    expect(isNavItemActive("/dojo-x", "/dojo")).toBe(false);
  });
});
