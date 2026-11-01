import { describe, expect, it } from "vitest";

import { isTabHref } from "./tab-href";

describe("isTabHref", () => {
  it("タブの入口はタブ", () => {
    for (const href of [
      "/",
      "/dojo",
      "/practice",
      "/lessons",
      "/score-table",
    ]) {
      expect(isTabHref(href)).toBe(true);
    }
  });

  it("クエリ・ハッシュが付いてもタブ", () => {
    expect(isTabHref("/practice?rank=kyu-5")).toBe(true);
    expect(isTabHref("/lessons#basics")).toBe(true);
  });

  it("タブの下の画面はタブではない", () => {
    expect(isTabHref("/practice/jantou-fu")).toBe(false);
    expect(isTabHref("/dojo/ranks/kyu-5")).toBe(false);
    expect(isTabHref("/lessons/jantou-fu")).toBe(false);
    expect(isTabHref("/announcements")).toBe(false);
  });
});
