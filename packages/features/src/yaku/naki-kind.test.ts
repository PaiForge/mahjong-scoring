import { describe, expect, it } from "vitest";
import { YAKU_HAN_ENTRIES } from "@mahjong-scoring/core";
import { messages } from "@mahjong-scoring/messages/ja";

import {
  ALL_NAKI_KINDS,
  NAKI_FILTER_OPTIONS,
  NAKI_KIND_ORDER,
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

describe("鳴き区分の並びと辞書キー", () => {
  it("区分の並びはすべての区分を 1 回ずつ持つ", () => {
    expect(new Set(NAKI_KIND_ORDER)).toEqual(new Set(Object.values(NakiKind)));
    expect(NAKI_KIND_ORDER).toHaveLength(Object.values(NakiKind).length);
  });

  it("区分はレッスンの比較表の辞書キーにある", () => {
    for (const kind of NAKI_KIND_ORDER) {
      expect(Object.keys(messages.yaku.learn.nakiKinds)).toContain(kind);
    }
  });

  it("絞り込みの選択肢は「すべて」が先頭で、続けて区分を並びどおりに持つ", () => {
    expect(NAKI_FILTER_OPTIONS).toEqual([ALL_NAKI_KINDS, ...NAKI_KIND_ORDER]);
    expect(NAKI_FILTER_OPTIONS[0]).toBe(ALL_NAKI_KINDS);
  });

  it("絞り込みの選択肢はすべて役一覧の絞り込みの辞書キーにあり、重複しない", () => {
    expect(new Set(NAKI_FILTER_OPTIONS).size).toBe(NAKI_FILTER_OPTIONS.length);
    for (const filter of NAKI_FILTER_OPTIONS) {
      expect(Object.keys(messages.reference.yaku.nakiFilters)).toContain(
        filter,
      );
    }
  });

  it("どの役もいずれか 1 つの区分にだけ当てはまる", () => {
    for (const entry of YAKU_HAN_ENTRIES) {
      const matched = NAKI_KIND_ORDER.filter((kind) =>
        matchesNakiFilter(kind, entry),
      );
      expect(matched).toEqual([classifyNakiKind(entry)]);
    }
  });
});
