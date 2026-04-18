import { describe, expect, it } from "vitest";

import { parsePlayerType, playerTypeToOptions } from "../types";

describe("parsePlayerType", () => {
  it('"child" を返す', () => {
    expect(parsePlayerType("child")).toBe("child");
  });

  it('"parent" を返す', () => {
    expect(parsePlayerType("parent")).toBe("parent");
  });

  it('"random" を返す', () => {
    expect(parsePlayerType("random")).toBe("random");
  });

  it("undefined の場合 デフォルトで random を返す", () => {
    expect(parsePlayerType(undefined)).toBe("random");
  });

  it("不正な文字列の場合 random を返す", () => {
    expect(parsePlayerType("invalid")).toBe("random");
  });

  it("空文字列の場合 random を返す", () => {
    expect(parsePlayerType("")).toBe("random");
  });
});

describe("playerTypeToOptions", () => {
  it("child の場合 includeParent: false, includeChild: true を返す", () => {
    expect(playerTypeToOptions("child")).toEqual({
      includeParent: false,
      includeChild: true,
    });
  });

  it("parent の場合 includeParent: true, includeChild: false を返す", () => {
    expect(playerTypeToOptions("parent")).toEqual({
      includeParent: true,
      includeChild: false,
    });
  });

  it("random の場合 includeParent: true, includeChild: true を返す", () => {
    expect(playerTypeToOptions("random")).toEqual({
      includeParent: true,
      includeChild: true,
    });
  });
});
