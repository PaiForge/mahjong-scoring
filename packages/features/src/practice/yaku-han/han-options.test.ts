import { describe, expect, it } from "vitest";
import { compareNumbers, YAKU_HAN_ENTRIES } from "@mahjong-scoring/core";

import { YAKU_HAN_OPTIONS, yakuHanStateLabel } from "./han-options";

describe("YAKU_HAN_OPTIONS", () => {
  it("出題される役の門前・鳴きの翻数はどれも選択肢にある", () => {
    // 選択肢に無い翻数が正解の問題は、どのボタンを押しても正解にできない
    const options: readonly number[] = YAKU_HAN_OPTIONS;
    for (const entry of YAKU_HAN_ENTRIES) {
      expect(options, entry.name).toContain(entry.menzenHan);
      if (entry.nakiHan !== undefined) {
        expect(options, entry.name).toContain(entry.nakiHan);
      }
    }
  });

  it("重複なく小さい順に並ぶ", () => {
    expect(new Set(YAKU_HAN_OPTIONS).size).toBe(YAKU_HAN_OPTIONS.length);
    expect([...YAKU_HAN_OPTIONS].sort(compareNumbers)).toEqual([
      ...YAKU_HAN_OPTIONS,
    ]);
  });
});

describe("yakuHanStateLabel", () => {
  const t = (key: string) => `<${key}>`;

  it("門前なら menzen、鳴きなら naki のキーを引く", () => {
    expect(yakuHanStateLabel(true, t)).toBe("<menzen>");
    expect(yakuHanStateLabel(false, t)).toBe("<naki>");
  });
});
