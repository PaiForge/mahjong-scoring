import { describe, expect, it } from "vitest";
import {
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_KO_PART,
  TSUMO_SCORES_OYA_PART,
} from "@mahjong-scoring/core";

import { getAvailableScores } from "../get-available-scores";

describe("getAvailableScores", () => {
  describe('範囲 "all"', () => {
    it("子ロンで全点数を返す", () => {
      const available = getAvailableScores(1, false, false, "all");

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toEqual(RON_SCORES_KO);
    });

    it("親ロンで全点数を返す", () => {
      const available = getAvailableScores(1, true, false, "all");

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toEqual(RON_SCORES_OYA);
    });

    it("親ツモで全点数を返す", () => {
      const available = getAvailableScores(1, true, true, "all");

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toEqual(TSUMO_SCORES_OYA_PART);
    });

    it("子ツモで子・親それぞれの全点数を返す", () => {
      const available = getAvailableScores(1, false, true, "all");

      expect(available.type).toBe("koTsumo");
      if (available.type !== "koTsumo") return;
      expect(available.koScores).toEqual(TSUMO_SCORES_KO_PART);
      expect(available.oyaScores).toEqual(TSUMO_SCORES_OYA_PART);
    });

    it("翻数によって選択肢が変わらない", () => {
      // 選択肢の個数が翻数のヒントになってはならない（試験で使う範囲のため）
      const oneHan = getAvailableScores(1, false, false, "all");
      const yakuman = getAvailableScores(13, false, false, "all");

      expect(oneHan).toEqual(yakuman);
    });

    it("切り上げ満貫の設定によって選択肢が変わらない", () => {
      // 試験は全受験者を同じ土俵で比較するため、選択肢が端末ローカルの
      // ルール設定に依存してはならない
      const standard = getAvailableScores(4, false, false, "all", false);
      const kiriage = getAvailableScores(4, false, false, "all", true);

      expect(standard).toEqual(kiriage);
    });
  });

  describe("点数帯による絞り込みとの違い", () => {
    it('"all" は満貫未満・満貫以上のどちらより広い', () => {
      const all = getAvailableScores(1, false, false, "all");
      const nonMangan = getAvailableScores(1, false, false, "nonMangan");
      const manganPlus = getAvailableScores(1, false, false, "manganPlus");

      expect(all.type).toBe("single");
      expect(nonMangan.type).toBe("single");
      expect(manganPlus.type).toBe("single");
      if (
        all.type !== "single" ||
        nonMangan.type !== "single" ||
        manganPlus.type !== "single"
      ) {
        return;
      }

      expect(all.scores.length).toBe(
        nonMangan.scores.length + manganPlus.scores.length,
      );
    });
  });

  describe("ダブル役満採用時", () => {
    it("子ロンの選択肢に 64000 が足される", () => {
      const available = getAvailableScores(
        26,
        false,
        false,
        undefined,
        false,
        true,
      );

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toContain(64000);
    });

    it("親ロンの選択肢に 96000 が足される", () => {
      const available = getAvailableScores(
        26,
        true,
        false,
        undefined,
        false,
        true,
      );

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toContain(96000);
    });

    it("子ツモの選択肢に 16000 / 32000 が足される", () => {
      const available = getAvailableScores(
        26,
        false,
        true,
        undefined,
        false,
        true,
      );

      expect(available.type).toBe("koTsumo");
      if (available.type !== "koTsumo") return;
      expect(available.koScores).toContain(16000);
      expect(available.oyaScores).toContain(32000);
    });

    it("親ツモの選択肢に 32000 オールが足される", () => {
      const available = getAvailableScores(
        26,
        true,
        true,
        undefined,
        false,
        true,
      );

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toContain(32000);
    });

    it("採用しないとき（既定）は選択肢が変わらない", () => {
      const withoutFlag = getAvailableScores(13, false, false);
      const explicitOff = getAvailableScores(
        13,
        false,
        false,
        undefined,
        false,
        false,
      );

      expect(explicitOff).toEqual(withoutFlag);
      if (withoutFlag.type !== "single") return;
      expect(withoutFlag.scores).not.toContain(64000);
    });
  });
});
