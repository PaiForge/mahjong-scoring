import { describe, expect, it } from "vitest";

import {
  FULL_SELECTION,
  hasSelectionParams,
  searchParamsToSelection,
  selectionToGeneratorOptions,
  selectionToQueryString,
} from "../options";

describe("searchParamsToSelection", () => {
  it("パラメータ無しは全軸オンになる", () => {
    expect(searchParamsToSelection({})).toEqual(FULL_SELECTION);
  });

  it("指定の無い軸は全選択、指定のある軸はその値のみになる（roles=ko）", () => {
    const sel = searchParamsToSelection({ roles: "ko" });
    expect(sel.includeKo).toBe(true);
    expect(sel.includeOya).toBe(false);
    // 未指定の軸は全選択
    expect(sel.includeTsumo).toBe(true);
    expect(sel.includeRon).toBe(true);
    expect(sel.includeNonMangan).toBe(true);
    expect(sel.includeManganPlus).toBe(true);
  });

  it("ガイドの 子・ロン・満貫以上 を正しく復元する", () => {
    const sel = searchParamsToSelection({
      roles: "ko",
      wins: "ron",
      ranges: "plus",
    });
    expect(sel).toEqual({
      includeOya: false,
      includeKo: true,
      includeTsumo: false,
      includeRon: true,
      includeNonMangan: false,
      includeManganPlus: true,
    });
  });

  it("配列パラメータ（両方指定）も解釈できる", () => {
    const sel = searchParamsToSelection({ roles: ["oya", "ko"] });
    expect(sel.includeOya).toBe(true);
    expect(sel.includeKo).toBe(true);
  });
});

describe("hasSelectionParams", () => {
  it("条件パラメータが1つでもあれば true", () => {
    expect(hasSelectionParams({ ranges: "plus" })).toBe(true);
  });
  it("条件パラメータが無ければ false", () => {
    expect(hasSelectionParams({})).toBe(false);
    expect(hasSelectionParams({ other: "x" })).toBe(false);
  });
});

describe("selectionToGeneratorOptions", () => {
  it("点数帯を nonMangan/manganPlus へマップする", () => {
    const opts = selectionToGeneratorOptions(
      searchParamsToSelection({ roles: "ko", wins: "ron", ranges: "plus" }),
    );
    expect(opts.roles).toEqual(["ko"]);
    expect(opts.wins).toEqual(["ron"]);
    expect(opts.ranges).toEqual(["manganPlus"]);
  });

  it("全選択は全値を含む", () => {
    const opts = selectionToGeneratorOptions(FULL_SELECTION);
    expect(opts.roles).toEqual(["oya", "ko"]);
    expect(opts.wins).toEqual(["tsumo", "ron"]);
    expect(opts.ranges).toEqual(["nonMangan", "manganPlus"]);
  });
});

describe("selectionToQueryString", () => {
  it("全選択の軸はクエリを生成しない", () => {
    expect(selectionToQueryString(FULL_SELECTION)).toBe("");
  });

  it("部分選択は searchParamsToSelection と往復一致する", () => {
    const original = searchParamsToSelection({
      roles: "ko",
      wins: "ron",
      ranges: "plus",
    });
    const query = selectionToQueryString(original);
    const roundTripped = searchParamsToSelection(
      Object.fromEntries(new URLSearchParams(query).entries()),
    );
    // URLSearchParams.entries() は同名キーを1つに潰すが、ガイド設定は各軸1値のため一致する
    expect(roundTripped).toEqual(original);
  });
});
