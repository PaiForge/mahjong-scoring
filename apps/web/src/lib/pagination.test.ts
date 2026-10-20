import { describe, expect, it } from "vitest";

import { clampPage, resolvePagination } from "./pagination";

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

describe("resolvePagination", () => {
  it("範囲内のページはそのまま確定し、取り出し位置を返す", () => {
    expect(resolvePagination(2, 45, 20)).toEqual({
      currentPage: 2,
      totalPages: 3,
      limit: 20,
      offset: 20,
    });
  });

  it("最終ページを超えたら最終ページに丸め、その位置を返す", () => {
    expect(resolvePagination(9, 45, 20)).toEqual({
      currentPage: 3,
      totalPages: 3,
      limit: 20,
      offset: 40,
    });
  });

  it("件数が 0 でも 1 ページ目（総ページ 1・先頭から）", () => {
    expect(resolvePagination(4, 0, 20)).toEqual({
      currentPage: 1,
      totalPages: 1,
      limit: 20,
      offset: 0,
    });
  });
});
