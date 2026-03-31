import { describe, it, expect } from "vitest";
import {
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_OYA_PART,
  TSUMO_SCORES_KO_PART,
} from "./constants";

describe("RON_SCORES_KO", () => {
  it("昇順にソートされている", () => {
    for (let i = 1; i < RON_SCORES_KO.length; i++) {
      expect(RON_SCORES_KO[i]).toBeGreaterThan(RON_SCORES_KO[i - 1]!);
    }
  });

  it("重複がない", () => {
    const unique = new Set(RON_SCORES_KO);
    expect(unique.size).toBe(RON_SCORES_KO.length);
  });

  it("最小値が1000（子ロン30符1翻）", () => {
    expect(RON_SCORES_KO[0]).toBe(1000);
  });

  it("最大値が32000（役満）", () => {
    expect(RON_SCORES_KO[RON_SCORES_KO.length - 1]).toBe(32000);
  });

  it("すべての値が100の倍数である", () => {
    for (const score of RON_SCORES_KO) {
      expect(score % 100).toBe(0);
    }
  });

  it("8000（満貫）を含む", () => {
    expect(RON_SCORES_KO).toContain(8000);
  });

  it("12000（跳満）を含む", () => {
    expect(RON_SCORES_KO).toContain(12000);
  });

  it("16000（倍満）を含む", () => {
    expect(RON_SCORES_KO).toContain(16000);
  });

  it("24000（三倍満）を含む", () => {
    expect(RON_SCORES_KO).toContain(24000);
  });
});

describe("RON_SCORES_OYA", () => {
  it("昇順にソートされている", () => {
    for (let i = 1; i < RON_SCORES_OYA.length; i++) {
      expect(RON_SCORES_OYA[i]).toBeGreaterThan(RON_SCORES_OYA[i - 1]!);
    }
  });

  it("重複がない", () => {
    const unique = new Set(RON_SCORES_OYA);
    expect(unique.size).toBe(RON_SCORES_OYA.length);
  });

  it("最小値が1500（親ロン30符1翻）", () => {
    expect(RON_SCORES_OYA[0]).toBe(1500);
  });

  it("最大値が48000（役満）", () => {
    expect(RON_SCORES_OYA[RON_SCORES_OYA.length - 1]).toBe(48000);
  });

  it("すべての値が100の倍数である", () => {
    for (const score of RON_SCORES_OYA) {
      expect(score % 100).toBe(0);
    }
  });

  it("12000（満貫）を含む", () => {
    expect(RON_SCORES_OYA).toContain(12000);
  });

  it("18000（跳満）を含む", () => {
    expect(RON_SCORES_OYA).toContain(18000);
  });

  it("24000（倍満）を含む", () => {
    expect(RON_SCORES_OYA).toContain(24000);
  });

  it("36000（三倍満）を含む", () => {
    expect(RON_SCORES_OYA).toContain(36000);
  });
});

describe("TSUMO_SCORES_OYA_PART", () => {
  it("昇順にソートされている", () => {
    for (let i = 1; i < TSUMO_SCORES_OYA_PART.length; i++) {
      expect(TSUMO_SCORES_OYA_PART[i]).toBeGreaterThan(TSUMO_SCORES_OYA_PART[i - 1]!);
    }
  });

  it("重複がない", () => {
    const unique = new Set(TSUMO_SCORES_OYA_PART);
    expect(unique.size).toBe(TSUMO_SCORES_OYA_PART.length);
  });

  it("すべての値が100の倍数である", () => {
    for (const score of TSUMO_SCORES_OYA_PART) {
      expect(score % 100).toBe(0);
    }
  });

  it("4000（満貫）を含む", () => {
    expect(TSUMO_SCORES_OYA_PART).toContain(4000);
  });
});

describe("TSUMO_SCORES_KO_PART", () => {
  it("昇順にソートされている", () => {
    for (let i = 1; i < TSUMO_SCORES_KO_PART.length; i++) {
      expect(TSUMO_SCORES_KO_PART[i]).toBeGreaterThan(TSUMO_SCORES_KO_PART[i - 1]!);
    }
  });

  it("重複がない", () => {
    const unique = new Set(TSUMO_SCORES_KO_PART);
    expect(unique.size).toBe(TSUMO_SCORES_KO_PART.length);
  });

  it("すべての値が100の倍数である", () => {
    for (const score of TSUMO_SCORES_KO_PART) {
      expect(score % 100).toBe(0);
    }
  });

  it("2000（満貫）を含む", () => {
    expect(TSUMO_SCORES_KO_PART).toContain(2000);
  });
});
