import { describe, expect, it } from "vitest";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";

import { HAN_OPTIONS, hanCountLabel } from "../han-options";

/** テスト用の翻訳関数（ja.json の hanCountChallenge と同じ体裁を返す） */
function t(key: string, values?: Record<string, number>): string {
  if (key === "yakuman") return "役満";
  if (key === "hanOption") return `${values?.count}翻`;
  throw new Error(`未知の翻訳キー: ${key}`);
}

describe("HAN_OPTIONS", () => {
  it("1翻から役満までの連番になっている", () => {
    expect(HAN_OPTIONS[0]).toBe(1);
    expect(HAN_OPTIONS[HAN_OPTIONS.length - 1]).toBe(YAKUMAN_HAN);
    expect(HAN_OPTIONS).toHaveLength(YAKUMAN_HAN);
  });
});

describe("hanCountLabel", () => {
  it("役満未満は「n翻」表記", () => {
    expect(hanCountLabel(1, t)).toBe("1翻");
    expect(hanCountLabel(12, t)).toBe("12翻");
  });

  it("役満の翻数は「役満」表記", () => {
    expect(hanCountLabel(YAKUMAN_HAN, t)).toBe("役満");
  });

  it("役満超えの値が紛れても「役満」表記に落ちる（丸め漏れ防御）", () => {
    expect(hanCountLabel(YAKUMAN_HAN + 1, t)).toBe("役満");
    expect(hanCountLabel(26, t)).toBe("役満");
  });
});
