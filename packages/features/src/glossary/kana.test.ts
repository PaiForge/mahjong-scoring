import { describe, expect, it } from "vitest";

import { KANA_ROWS, kanaAnchorId, kanaRowOf, type KanaRow } from "./kana";

describe("kanaRowOf", () => {
  it("清音の読みをその行に入れる", () => {
    expect(kanaRowOf("メンツ")).toBe("ま");
    expect(kanaRowOf("シュンツ")).toBe("さ");
    expect(kanaRowOf("テハイ")).toBe("た");
  });

  it("濁点・半濁点は清音の行に寄せる", () => {
    expect(kanaRowOf("ジハイ")).toBe("さ");
    expect(kanaRowOf("バイマン")).toBe("は");
    expect(kanaRowOf("ピンフ")).toBe("は");
    expect(kanaRowOf("ドラ")).toBe("た");
  });

  it("ン で始まる読みは わ行 に入る", () => {
    expect(kanaRowOf("ンー")).toBe("わ");
  });

  it("空文字列や行に当たらない読みは undefined", () => {
    expect(kanaRowOf("")).toBeUndefined();
    expect(kanaRowOf("3900")).toBeUndefined();
  });
});

/**
 * 行見出し（ひらがな）をカタカナに直した文字
 *
 * ひらがなとカタカナは Unicode で同じ並びのまま 0x60 ずれている。
 */
function rowHeadKatakana(row: KanaRow): string {
  return String.fromCodePoint(row.codePointAt(0)! + 0x60);
}

/** 小書きの仮名（Unicode では直後が同じ音の大きい仮名） */
const SMALL_KANA = new Set([..."ァィゥェォッャュョヮ"]);

/**
 * 読みの頭 1 文字が入るはずの五十音の行を、Unicode の並びから導く
 *
 * 濁点・半濁点は NFD で外し、小書きは直後の大きい仮名に寄せる。カタカナは
 * Unicode で五十音順に並ぶので、行見出しの文字以上で最も後ろの行がその文字の行。
 */
function expectedRowOf(char: string): KanaRow | undefined {
  const voiceless = char.normalize("NFD").replace(/[\u3099\u309A]/g, "");
  const base = SMALL_KANA.has(voiceless)
    ? String.fromCodePoint(voiceless.codePointAt(0)! + 1)
    : voiceless;
  return KANA_ROWS.filter((row) => rowHeadKatakana(row) <= base).at(-1);
}

/**
 * 読みの頭に来うるカタカナ（ァ〜ヴ）
 *
 * ヰ・ヱ は現代の読みに現れないため除く（索引のどの行にも入れない）。
 */
const KATAKANA_HEADS = Array.from({ length: 0x30f4 - 0x30a1 + 1 }, (_, i) =>
  String.fromCodePoint(0x30a1 + i),
).filter((char) => char !== "ヰ" && char !== "ヱ");

describe("kanaRowOf（すべてのカタカナ）", () => {
  it.each(KATAKANA_HEADS)(
    "%s で始まる読みは五十音の並びどおりの行に入る",
    (char) => {
      expect(kanaRowOf(`${char}ー`)).toBe(expectedRowOf(char));
    },
  );

  it("どの行にも 1 文字以上の読みが入る", () => {
    const rows = new Set(KATAKANA_HEADS.map((char) => kanaRowOf(char)));
    expect([...rows]).toEqual([...KANA_ROWS]);
  });
});

describe("kanaAnchorId", () => {
  it("行ごとに異なる、行見出しのローマ字（あ段）を持つアンカーを返す", () => {
    const ids = KANA_ROWS.map((row) => kanaAnchorId(row));
    expect(new Set(ids).size).toBe(KANA_ROWS.length);
    for (const id of ids) expect(id).toMatch(/^kana-[kstnhmyrw]?a$/);
  });
});
