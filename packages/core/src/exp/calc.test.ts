import { describe, expect, it } from "vitest";

import { calculateExp } from "./calc";
import type { ExpInput, ExpResult } from "./types";

/**
 * `calculateExp` が null を返さないことを前提にテストするためのヘルパー。
 * null の場合はテストを即座に fail させる。
 */
function calc(input: ExpInput): ExpResult {
  const result = calculateExp(input);
  if (result === null) {
    throw new Error(`calculateExp unexpectedly returned null for ${JSON.stringify(input)}`);
  }
  return result;
}

describe("calculateExp", () => {
  // --------------------------------------------------------------
  // 基本計算（score * weight）
  // --------------------------------------------------------------
  describe("基本計算", () => {
    it("score * weight で baseExp を計算する（jantou_fu: weight=1）", () => {
      const result = calc({
        score: 5,
        incorrectAnswers: 3,
        menuType: "jantou_fu",
      });
      expect(result.baseExp).toBe(5);
      expect(result.totalExp).toBe(5);
    });
  });

  // --------------------------------------------------------------
  // ホワイトリスト（未登録 menuType は null）
  // --------------------------------------------------------------
  describe("ホワイトリスト", () => {
    it("未登録の menuType（ホワイトリストに無い）は null を返す", () => {
      const result = calculateExp({
        score: 7,
        incorrectAnswers: 3,
        menuType: "unknown_module",
      });
      expect(result).toBeNull();
    });

    it("MODULE_WEIGHT に登録されていないドリル種別は全て null", () => {
      for (const menuType of [
        "machi_fu",
        "mentsu_fu",
        "tehai_fu",
        "yaku",
        "score_table",
        "score_calculation",
        "han_count",
      ]) {
        const result = calculateExp({
          score: 10,
          incorrectAnswers: 0,
          menuType,
        });
        expect(result).toBeNull();
      }
    });
  });

  // --------------------------------------------------------------
  // 精度ボーナス
  // --------------------------------------------------------------
  describe("精度ボーナス", () => {
    it("ミス 0（パーフェクト）で 1.5 倍", () => {
      const result = calc({
        score: 10,
        incorrectAnswers: 0,
        menuType: "jantou_fu",
      });
      expect(result.accuracyMultiplier).toBe(1.5);
      expect(result.totalExp).toBe(15);
    });

    it("ミス 1 で 1.2 倍", () => {
      const result = calc({
        score: 10,
        incorrectAnswers: 1,
        menuType: "jantou_fu",
      });
      expect(result.accuracyMultiplier).toBe(1.2);
      expect(result.totalExp).toBe(12);
    });

    it("ミス 2 で 1.1 倍", () => {
      const result = calc({
        score: 10,
        incorrectAnswers: 2,
        menuType: "jantou_fu",
      });
      expect(result.accuracyMultiplier).toBe(1.1);
      expect(result.totalExp).toBe(11);
    });

    it("ミス 3（バースト）はボーナスなし（1.0 倍）", () => {
      const result = calc({
        score: 10,
        incorrectAnswers: 3,
        menuType: "jantou_fu",
      });
      expect(result.accuracyMultiplier).toBe(1.0);
      expect(result.totalExp).toBe(10);
    });

    it("incorrectAnswers が 3 を超えても倍率 1.0 が使われる", () => {
      const result = calc({
        score: 10,
        incorrectAnswers: 5,
        menuType: "jantou_fu",
      });
      expect(result.accuracyMultiplier).toBe(1.0);
      expect(result.totalExp).toBe(10);
    });
  });

  // --------------------------------------------------------------
  // 最低保証
  // --------------------------------------------------------------
  describe("最低保証", () => {
    it("score 0 でも最低保証 1 EXP", () => {
      const result = calc({
        score: 0,
        incorrectAnswers: 0,
        menuType: "jantou_fu",
      });
      expect(result.baseExp).toBe(0);
      expect(result.totalExp).toBe(1);
    });

    it("score 0 + バースト（ミス 3）でも最低保証 1 EXP", () => {
      const result = calc({
        score: 0,
        incorrectAnswers: 3,
        menuType: "jantou_fu",
      });
      expect(result.baseExp).toBe(0);
      expect(result.totalExp).toBe(1);
    });
  });

  // --------------------------------------------------------------
  // floor の適用タイミング
  // --------------------------------------------------------------
  describe("floor の適用", () => {
    it("乗算の最後でのみ floor される", () => {
      // baseExp=11, mult=1.1 -> 12.1 -> floor 12
      const result = calc({
        score: 11,
        incorrectAnswers: 2,
        menuType: "jantou_fu",
      });
      expect(result.totalExp).toBe(12);
    });
  });

  // --------------------------------------------------------------
  // 追加: 境界値と防御的動作
  // --------------------------------------------------------------
  describe("防御的境界", () => {
    it("非常に大きい score（10000）でもオーバーフローしない整数を返す", () => {
      const result = calc({
        score: 10000,
        incorrectAnswers: 0,
        menuType: "jantou_fu",
      });
      // 10000 * 1 * 1.5 = 15000
      expect(result.totalExp).toBe(15000);
      expect(Number.isFinite(result.totalExp)).toBe(true);
      expect(Number.isInteger(result.totalExp)).toBe(true);
    });

    it("incorrectAnswers が負の値でも最大倍率（ミス 0 と同等）にフォールバックする", () => {
      // 負値は `-1 <= 0` を満たすため現状の実装ではミス 0 の倍率 1.5 が返る
      const result = calc({
        score: 10,
        incorrectAnswers: -1,
        menuType: "jantou_fu",
      });
      expect(result.accuracyMultiplier).toBe(1.5);
      expect(result.totalExp).toBeGreaterThanOrEqual(1);
    });

    it("score=0 + ミス 2 でも最低保証 1 EXP", () => {
      const result = calc({
        score: 0,
        incorrectAnswers: 2,
        menuType: "jantou_fu",
      });
      expect(result.totalExp).toBe(1);
    });

    it("空文字の menuType は null（ホワイトリスト厳格判定）", () => {
      expect(
        calculateExp({ score: 5, incorrectAnswers: 0, menuType: "" }),
      ).toBeNull();
    });

    it("全ミスバケット（0/1/2/3）で jantou_fu の累計 EXP が単調減少する", () => {
      const perfect = calc({ score: 20, incorrectAnswers: 0, menuType: "jantou_fu" }).totalExp;
      const oneMiss = calc({ score: 20, incorrectAnswers: 1, menuType: "jantou_fu" }).totalExp;
      const twoMiss = calc({ score: 20, incorrectAnswers: 2, menuType: "jantou_fu" }).totalExp;
      const burst = calc({ score: 20, incorrectAnswers: 3, menuType: "jantou_fu" }).totalExp;
      expect(perfect).toBeGreaterThan(oneMiss);
      expect(oneMiss).toBeGreaterThan(twoMiss);
      expect(twoMiss).toBeGreaterThan(burst);
      expect(burst).toBe(20); // baseExp 20 * 1.0
    });
  });
});
