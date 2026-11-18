import { describe, expect, it } from "vitest";

import { YAKU_HAN_ENTRIES } from "@mahjong-scoring/core";

import { scoreOf, sumMenzenHan } from "./agari-quiz";

function menzenHanOf(name: string): number {
  const entry = YAKU_HAN_ENTRIES.find((candidate) => candidate.name === name);
  if (entry === undefined) throw new Error(`役が無い: ${name}`);
  return entry.menzenHan;
}

describe("sumMenzenHan", () => {
  it("役ごとの門前の翻数を足す", () => {
    expect(sumMenzenHan(["立直", "混一色"])).toBe(
      menzenHanOf("立直") + menzenHanOf("混一色"),
    );
    expect(sumMenzenHan([])).toBe(0);
  });

  it("一覧に無い役名は定義の誤りとして例外にする", () => {
    expect(() => sumMenzenHan(["立直", "存在しない役"])).toThrow();
  });
});

describe("scoreOf", () => {
  it("親は子より高い点数になる（親と子で別の表を引く）", () => {
    const oya = scoreOf("oya", 3, 30);
    const ko = scoreOf("ko", 3, 30);
    expect(oya.ron).toBeGreaterThan(ko.ron);
  });
});
