import { describe, expect, it } from "vitest";
import { YAKU_HAN_ENTRIES } from "@mahjong-scoring/core";

import {
  ALL_NAKI_KINDS,
  NakiKind,
  classifyNakiKind,
  matchesNakiFilter,
} from "./naki-kind";

/** 役名から役のデータを引く（テスト用） */
function entryOf(name: string) {
  const entry = YAKU_HAN_ENTRIES.find((item) => item.name === name);
  if (entry === undefined) throw new Error(`unknown yaku: ${name}`);
  return entry;
}

describe("classifyNakiKind", () => {
  it("鳴くと成立しない役は門前限定", () => {
    expect(classifyNakiKind(entryOf("平和"))).toBe(NakiKind.MenzenOnly);
    expect(classifyNakiKind(entryOf("四暗刻"))).toBe(NakiKind.MenzenOnly);
  });

  it("鳴くと翻数が下がる役は食い下がり", () => {
    expect(classifyNakiKind(entryOf("混一色"))).toBe(NakiKind.Kuisagari);
  });

  it("鳴いても翻数が同じ役は変わらない", () => {
    expect(classifyNakiKind(entryOf("断么九"))).toBe(NakiKind.Unchanged);
    expect(classifyNakiKind(entryOf("大三元"))).toBe(NakiKind.Unchanged);
  });
});

describe("matchesNakiFilter", () => {
  it("「すべて」はどの役も通す", () => {
    for (const entry of YAKU_HAN_ENTRIES) {
      expect(matchesNakiFilter(ALL_NAKI_KINDS, entry)).toBe(true);
    }
  });

  it("区分を選ぶとその区分の役だけを通す", () => {
    expect(matchesNakiFilter(NakiKind.Kuisagari, entryOf("清一色"))).toBe(true);
    expect(matchesNakiFilter(NakiKind.Kuisagari, entryOf("対々和"))).toBe(
      false,
    );
  });
});
