import { describe, expect, it } from "vitest";
import { HaiKind } from "@mahjong-scoring/core";

import { buildDemoTehai, DEMO_FU_TEHAI } from "../demo-tehai";

/** 234m / 567p / 中中中 / 678s / 南南 */
const VALID_CLOSED = [
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.ManZu4,
  HaiKind.PinZu5,
  HaiKind.PinZu6,
  HaiKind.PinZu7,
  HaiKind.Chun,
  HaiKind.Chun,
  HaiKind.Chun,
  HaiKind.SouZu6,
  HaiKind.SouZu7,
  HaiKind.SouZu8,
  HaiKind.Nan,
  HaiKind.Nan,
];

describe("buildDemoTehai", () => {
  it("14枚の手牌を組み立てる", () => {
    expect(buildDemoTehai(VALID_CLOSED).closed).toHaveLength(14);
  });

  it("枚数が足りない牌姿は投げる（黙って描画を消さない）", () => {
    expect(() => buildDemoTehai(VALID_CLOSED.slice(0, 13))).toThrow();
  });

  it("同じ牌が5枚ある牌姿は投げる", () => {
    expect(() =>
      buildDemoTehai([
        ...Array(5).fill(HaiKind.ManZu1),
        ...VALID_CLOSED.slice(5),
      ]),
    ).toThrow();
  });
});

describe("DEMO_FU_TEHAI", () => {
  it("符の練習で共有する牌姿が組み立てられている", () => {
    expect(DEMO_FU_TEHAI.closed).toHaveLength(14);
  });
});
