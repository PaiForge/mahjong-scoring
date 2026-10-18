import { describe, expect, it } from "vitest";

import { clampPage } from "./pagination";

describe("clampPage", () => {
  it("範囲内のページはそのまま", () => {
    expect(clampPage(2, 3)).toBe(2);
  });

  it("最終ページを超えたら最終ページに寄せる", () => {
    expect(clampPage(9, 3)).toBe(3);
  });

  it("件数が 0（総ページ 0）でも 1 ページ目", () => {
    expect(clampPage(4, 0)).toBe(1);
  });

  it("1 未満は 1 ページ目", () => {
    expect(clampPage(0, 3)).toBe(1);
  });
});
