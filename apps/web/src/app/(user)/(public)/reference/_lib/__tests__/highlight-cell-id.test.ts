import { describe, expect, it } from "vitest";

import { isRole, isWinType, buildHighlightCellId } from "../score-table-utils";

describe("isRole", () => {
  it('"ko" は有効', () => {
    expect(isRole("ko")).toBe(true);
  });

  it('"oya" は有効', () => {
    expect(isRole("oya")).toBe(true);
  });

  it('"invalid" は無効', () => {
    expect(isRole("invalid")).toBe(false);
  });

  it('空文字は無効', () => {
    expect(isRole("")).toBe(false);
  });

  it('"KO" (大文字) は無効', () => {
    expect(isRole("KO")).toBe(false);
  });
});

describe("isWinType", () => {
  it('"ron" は有効', () => {
    expect(isWinType("ron")).toBe(true);
  });

  it('"tsumo" は有効', () => {
    expect(isWinType("tsumo")).toBe(true);
  });

  it('"invalid" は無効', () => {
    expect(isWinType("invalid")).toBe(false);
  });

  it('空文字は無効', () => {
    expect(isWinType("")).toBe(false);
  });
});

describe("buildHighlightCellId", () => {
  it("全パラメータ指定で正しいIDを生成する", () => {
    const result = buildHighlightCellId({
      role: "ko",
      winType: "ron",
      han: "2",
      fu: "30",
    });
    expect(result).toBe("ko-ron-2han-30fu");
  });

  it("親・ツモの場合", () => {
    const result = buildHighlightCellId({
      role: "oya",
      winType: "tsumo",
      han: "3",
      fu: "40",
    });
    expect(result).toBe("oya-tsumo-3han-40fu");
  });

  it("han が null なら undefined を返す", () => {
    const result = buildHighlightCellId({
      role: "ko",
      winType: "ron",
      han: null,
      fu: "30",
    });
    expect(result).toBeUndefined();
  });

  it("fu が null なら undefined を返す", () => {
    const result = buildHighlightCellId({
      role: "ko",
      winType: "ron",
      han: "2",
      fu: null,
    });
    expect(result).toBeUndefined();
  });

  it("han と fu が両方 null なら undefined を返す", () => {
    const result = buildHighlightCellId({
      role: "ko",
      winType: "ron",
      han: null,
      fu: null,
    });
    expect(result).toBeUndefined();
  });

  it("role が不正なら ko にフォールバック", () => {
    const result = buildHighlightCellId({
      role: "invalid",
      winType: "ron",
      han: "1",
      fu: "30",
    });
    expect(result).toBe("ko-ron-1han-30fu");
  });

  it("winType が不正なら ron にフォールバック", () => {
    const result = buildHighlightCellId({
      role: "ko",
      winType: "invalid",
      han: "1",
      fu: "30",
    });
    expect(result).toBe("ko-ron-1han-30fu");
  });

  it("role が null なら ko にフォールバック", () => {
    const result = buildHighlightCellId({
      role: null,
      winType: "tsumo",
      han: "2",
      fu: "40",
    });
    expect(result).toBe("ko-tsumo-2han-40fu");
  });

  it("winType が null なら ron にフォールバック", () => {
    const result = buildHighlightCellId({
      role: "oya",
      winType: null,
      han: "2",
      fu: "40",
    });
    expect(result).toBe("oya-ron-2han-40fu");
  });

  it("全パラメータ null なら undefined を返す", () => {
    const result = buildHighlightCellId({
      role: null,
      winType: null,
      han: null,
      fu: null,
    });
    expect(result).toBeUndefined();
  });
});
