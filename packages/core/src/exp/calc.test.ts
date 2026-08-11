import { describe, expect, it } from "vitest";

import { calculateExp } from "./calc";
import { MISS_BONUS, MODULE_WEIGHT } from "./constants";
import { MISTAKE_LIMIT } from "../challenge/constants";
import type { ExpInput, ExpResult } from "./types";

/**
 * `calculateExp` が undefined を返さないことを前提にテストするためのヘルパー。
 * undefined の場合はテストを即座に fail させる。
 */
function calc(input: ExpInput): ExpResult {
  const result = calculateExp(input);
  if (result === undefined) {
    throw new Error(
      `calculateExp unexpectedly returned undefined for ${JSON.stringify(input)}`,
    );
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
  // ホワイトリスト（未登録 menuType は undefined）
  // --------------------------------------------------------------
  describe("ホワイトリスト", () => {
    it("未登録の menuType（ホワイトリストに無い）は undefined を返す", () => {
      const result = calculateExp({
        score: 7,
        incorrectAnswers: 3,
        menuType: "unknown_module",
      });
      expect(result).toBeUndefined();
    });

    it("存在しない menuType（nonexistent_drill）は undefined を返す", () => {
      const result = calculateExp({
        score: 10,
        incorrectAnswers: 0,
        menuType: "nonexistent_drill",
      });
      expect(result).toBeUndefined();
    });

    // MODULE_WEIGHT から導出する。ここに練習種別のリストをコピーすると
    // 追加漏れが起きても気付けない（実際 yaku_han などが漏れていた）。
    // 「提供中の練習がすべて登録されているか」はレジストリを参照できる
    // web 側の lib/db/__tests__/exp-module-weight.test.ts が検証する。
    it("MODULE_WEIGHT に登録された全練習が ExpResult を返す", () => {
      const registered = Object.keys(MODULE_WEIGHT);
      expect(registered.length).toBeGreaterThan(0);

      for (const menuType of registered) {
        const result = calculateExp({
          score: 10,
          incorrectAnswers: 0,
          menuType,
        });
        expect(result, `${menuType} が ExpResult を返さない`).toBeDefined();
        // weight=1, score=10, mult=1.5 -> 15
        expect(result?.baseExp).toBe(10 * MODULE_WEIGHT[menuType]);
        expect(result?.totalExp).toBe(
          Math.floor(10 * MODULE_WEIGHT[menuType] * 1.5),
        );
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

    it("空文字の menuType は undefined（ホワイトリスト厳格判定）", () => {
      expect(
        calculateExp({ score: 5, incorrectAnswers: 0, menuType: "" }),
      ).toBeUndefined();
    });

    it("全ミスバケット（0/1/2/3）で jantou_fu の累計 EXP が単調減少する", () => {
      const perfect = calc({
        score: 20,
        incorrectAnswers: 0,
        menuType: "jantou_fu",
      }).totalExp;
      const oneMiss = calc({
        score: 20,
        incorrectAnswers: 1,
        menuType: "jantou_fu",
      }).totalExp;
      const twoMiss = calc({
        score: 20,
        incorrectAnswers: 2,
        menuType: "jantou_fu",
      }).totalExp;
      const burst = calc({
        score: 20,
        incorrectAnswers: 3,
        menuType: "jantou_fu",
      }).totalExp;
      expect(perfect).toBeGreaterThan(oneMiss);
      expect(oneMiss).toBeGreaterThan(twoMiss);
      expect(twoMiss).toBeGreaterThan(burst);
      expect(burst).toBe(20); // baseExp 20 * 1.0
    });
  });
});

describe("MISS_BONUS とチャレンジのミス上限", () => {
  it("ボーナスが付くのは 0〜MISTAKE_LIMIT-1 ミス（上限到達はボーナスなし）", () => {
    // 倍率は手で調整した値のため導出できない。上限を変えたときに
    // 表の段数の見直し漏れを検出するための対応チェック。
    expect(MISS_BONUS.map((b) => b.misses)).toEqual(
      Array.from({ length: MISTAKE_LIMIT }, (_, i) => i),
    );
  });

  it("上限ちょうどのミス（バースト）は倍率 1.0", () => {
    const burst = calc({
      score: 10,
      incorrectAnswers: MISTAKE_LIMIT,
      menuType: "jantou_fu",
    });
    expect(burst.accuracyMultiplier).toBe(1.0);
  });
});
