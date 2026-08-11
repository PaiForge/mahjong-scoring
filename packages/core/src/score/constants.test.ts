import { describe, it, expect } from "vitest";
import {
  FU_VALUES,
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_OYA_PART,
  TSUMO_SCORES_KO_PART,
} from "./constants";

/**
 * 点数候補リストが満たすべき不変条件
 *
 * 選択肢として提示するため、昇順・重複なし・100点単位であることを
 * どのリストにも要求する。個別の値（最小・最大・特定の打点を含むか）は
 * リストごとの describe で検証する。
 */
describe.each([
  ["RON_SCORES_KO", RON_SCORES_KO],
  ["RON_SCORES_OYA", RON_SCORES_OYA],
  ["TSUMO_SCORES_OYA_PART", TSUMO_SCORES_OYA_PART],
  ["TSUMO_SCORES_KO_PART", TSUMO_SCORES_KO_PART],
])("%s の不変条件", (_name, scores) => {
  it("昇順にソートされている", () => {
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]!);
    }
  });

  it("重複がない", () => {
    expect(new Set(scores).size).toBe(scores.length);
  });

  it("すべての値が100の倍数である", () => {
    for (const score of scores) {
      expect(score % 100).toBe(0);
    }
  });
});

describe("RON_SCORES_KO", () => {
  it("最小値が1000（子ロン30符1翻）", () => {
    expect(RON_SCORES_KO[0]).toBe(1000);
  });

  it("最大値が32000（役満）", () => {
    expect(RON_SCORES_KO[RON_SCORES_KO.length - 1]).toBe(32000);
  });

  it.each([
    [8000, "満貫"],
    [12000, "跳満"],
    [16000, "倍満"],
    [24000, "三倍満"],
  ])("%i（%s）を含む", (score) => {
    expect(RON_SCORES_KO).toContain(score);
  });
});

describe("RON_SCORES_OYA", () => {
  it("最小値が1500（親ロン30符1翻）", () => {
    expect(RON_SCORES_OYA[0]).toBe(1500);
  });

  it("最大値が48000（役満）", () => {
    expect(RON_SCORES_OYA[RON_SCORES_OYA.length - 1]).toBe(48000);
  });

  it.each([
    [12000, "満貫"],
    [18000, "跳満"],
    [24000, "倍満"],
    [36000, "三倍満"],
  ])("%i（%s）を含む", (score) => {
    expect(RON_SCORES_OYA).toContain(score);
  });
});

describe("TSUMO_SCORES_OYA_PART", () => {
  it("4000（満貫）を含む", () => {
    expect(TSUMO_SCORES_OYA_PART).toContain(4000);
  });
});

describe("TSUMO_SCORES_KO_PART", () => {
  it("2000（満貫）を含む", () => {
    expect(TSUMO_SCORES_KO_PART).toContain(2000);
  });
});

describe("FU_VALUES", () => {
  it("昇順にソートされている", () => {
    for (let i = 1; i < FU_VALUES.length; i++) {
      expect(FU_VALUES[i]).toBeGreaterThan(FU_VALUES[i - 1]!);
    }
  });

  it("20符から110符まで（平和ツモの20符と七対子の25符を含む）", () => {
    expect(FU_VALUES[0]).toBe(20);
    expect(FU_VALUES).toContain(25);
    expect(FU_VALUES[FU_VALUES.length - 1]).toBe(110);
  });

  it("25符以外は10刻み", () => {
    for (const fu of FU_VALUES) {
      if (fu === 25) continue;
      expect(fu % 10).toBe(0);
    }
  });
});
