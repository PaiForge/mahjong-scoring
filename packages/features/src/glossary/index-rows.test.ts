import { describe, expect, it } from "vitest";

import {
  ALPHA_ROWS,
  indexAnchorId,
  indexRowOf,
  indexRowsFor,
} from "./index-rows";
import { KANA_ROWS, kanaAnchorId, kanaRowOf } from "./kana";

describe("indexRowsFor", () => {
  it("日本語は五十音の行（あ〜わ）をそのまま返す", () => {
    expect(indexRowsFor("ja")).toBe(KANA_ROWS);
  });

  it("英語は A〜Z の 26 行を返す", () => {
    expect(indexRowsFor("en")).toBe(ALPHA_ROWS);
    expect(ALPHA_ROWS).toHaveLength(26);
    expect(ALPHA_ROWS[0]).toBe("A");
    expect(ALPHA_ROWS[25]).toBe("Z");
  });
});

describe("indexRowOf", () => {
  it("日本語は読みの五十音行（kanaRowOf と同じ）で、見出し語は見ない", () => {
    for (const reading of ["メンツ", "ジハイ", "ピンフ", "ンー", ""]) {
      expect(indexRowOf("面子", reading, "ja")).toBe(kanaRowOf(reading));
    }
  });

  it("英語は見出し語の頭文字（大文字）で、読みは見ない", () => {
    expect(indexRowOf("Pair", "jantou", "en")).toBe("P");
    expect(indexRowOf("closed hand", "menzen", "en")).toBe("C");
  });

  it("英語で英字以外から始まる見出し語は undefined", () => {
    expect(indexRowOf("面子", "mentsu", "en")).toBeUndefined();
    expect(indexRowOf("3900", "", "en")).toBeUndefined();
    expect(indexRowOf("", "", "en")).toBeUndefined();
  });
});

describe("indexAnchorId", () => {
  it("日本語の行は既存の五十音のアンカー（#kana-ka）と同じ値", () => {
    for (const row of KANA_ROWS) {
      expect(indexAnchorId(row)).toBe(kanaAnchorId(row));
    }
  });

  it("英語の行は alpha- に小文字を付けた id で、行どうし重ならない", () => {
    expect(indexAnchorId("A")).toBe("alpha-a");
    expect(indexAnchorId("Z")).toBe("alpha-z");
    const ids = [...KANA_ROWS, ...ALPHA_ROWS].map(indexAnchorId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
