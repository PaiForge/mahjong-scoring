import { describe, expect, it } from "vitest";

import {
  parseScoreTableFocusFromParams,
  resolveScoreTableFocus,
} from "../score-table-utils";

describe("parseScoreTableFocusFromParams", () => {
  it("全パラメータ指定で focus を組み立てる", () => {
    const result = parseScoreTableFocusFromParams({
      role: "oya",
      winType: "tsumo",
      han: "3",
      fu: "40",
    });
    expect(result).toEqual({ role: "oya", winType: "tsumo", han: 3, fu: 40 });
  });

  it("role が不正なら ko にフォールバック", () => {
    const result = parseScoreTableFocusFromParams({
      role: "invalid",
      winType: "ron",
      han: "1",
      fu: "30",
    });
    expect(result?.role).toBe("ko");
  });

  it("winType が null なら ron にフォールバック", () => {
    const result = parseScoreTableFocusFromParams({
      role: "oya",
      winType: null,
      han: "2",
      fu: "40",
    });
    expect(result?.winType).toBe("ron");
  });

  it("han が null なら undefined を返す", () => {
    const result = parseScoreTableFocusFromParams({
      role: "ko",
      winType: "ron",
      han: null,
      fu: "30",
    });
    expect(result).toBeUndefined();
  });

  it("han が数値でなければ undefined を返す", () => {
    const result = parseScoreTableFocusFromParams({
      role: "ko",
      winType: "ron",
      han: "abc",
      fu: "30",
    });
    expect(result).toBeUndefined();
  });

  it("fu が null でも han があれば focus を返す（満貫以上のリンク）", () => {
    const result = parseScoreTableFocusFromParams({
      role: "ko",
      winType: "ron",
      han: "6",
      fu: null,
    });
    expect(result).toEqual({
      role: "ko",
      winType: "ron",
      han: 6,
      fu: undefined,
    });
  });

  it("fu が符として不正なら fu だけ無視する", () => {
    const result = parseScoreTableFocusFromParams({
      role: "ko",
      winType: "ron",
      han: "3",
      fu: "15",
    });
    expect(result).toEqual({
      role: "ko",
      winType: "ron",
      han: 3,
      fu: undefined,
    });
  });
});

describe("resolveScoreTableFocus", () => {
  it("focus なしはハイライトなしの符×翻表", () => {
    expect(resolveScoreTableFocus(undefined)).toEqual({
      viewMode: "normal",
      normalCell: undefined,
      highScoreKey: undefined,
    });
  });

  it("4翻以下＋符ありは符×翻表のセルを指す", () => {
    expect(
      resolveScoreTableFocus({ role: "ko", winType: "ron", han: 3, fu: 40 }),
    ).toEqual({
      viewMode: "normal",
      normalCell: { han: 3, fu: 40 },
      highScoreKey: undefined,
    });
  });

  it("4翻満貫（切り上げ・高符）も符×翻表のセルを指す", () => {
    expect(
      resolveScoreTableFocus({ role: "oya", winType: "ron", han: 4, fu: 70 }),
    ).toEqual({
      viewMode: "normal",
      normalCell: { han: 4, fu: 70 },
      highScoreKey: undefined,
    });
  });

  it("5翻は満貫の区分行を指す", () => {
    expect(
      resolveScoreTableFocus({ role: "ko", winType: "tsumo", han: 5, fu: 30 }),
    ).toEqual({
      viewMode: "high_score",
      normalCell: undefined,
      highScoreKey: "mangan",
    });
  });

  it("6翻は跳満の区分行を指す", () => {
    expect(
      resolveScoreTableFocus({
        role: "ko",
        winType: "ron",
        han: 6,
        fu: undefined,
      }),
    ).toEqual({
      viewMode: "high_score",
      normalCell: undefined,
      highScoreKey: "haneman",
    });
  });

  it("13翻は役満の区分行を指す", () => {
    expect(
      resolveScoreTableFocus({
        role: "ko",
        winType: "ron",
        han: 13,
        fu: undefined,
      }),
    ).toEqual({
      viewMode: "high_score",
      normalCell: undefined,
      highScoreKey: "yakuman",
    });
  });

  it("26翻（ダブル役満相当）も役満の区分行に丸める", () => {
    expect(
      resolveScoreTableFocus({
        role: "ko",
        winType: "ron",
        han: 26,
        fu: undefined,
      }),
    ).toEqual({
      viewMode: "high_score",
      normalCell: undefined,
      highScoreKey: "yakuman",
    });
  });

  it("4翻以下で符が無ければハイライトなし", () => {
    expect(
      resolveScoreTableFocus({
        role: "ko",
        winType: "ron",
        han: 3,
        fu: undefined,
      }),
    ).toEqual({
      viewMode: "normal",
      normalCell: undefined,
      highScoreKey: undefined,
    });
  });
});
