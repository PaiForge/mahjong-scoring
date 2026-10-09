import { describe, expect, it } from "vitest";
import {
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_KO_PART,
  TSUMO_SCORES_OYA_PART,
} from "@mahjong-scoring/core";

import {
  calculateKoScore,
  calculateOyaScore,
  calculateTierScore,
  FU_VALUES,
  isInvalidCell,
  koTsumoPaymentKey,
  MANGAN_PLUS_TIERS,
  type ScoreRange,
} from "@mahjong-scoring/core";

import { getAvailableScores } from "./get-available-scores";
import type { AvailableScoresParams } from "./get-available-scores";

describe("getAvailableScores", () => {
  describe('範囲 "all"', () => {
    it("子ロンで全点数を返す", () => {
      const available = getAvailableScores({
        han: 1,
        isOya: false,
        isTsumo: false,
        scoreRange: "all",
      });

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toEqual(RON_SCORES_KO);
    });

    it("親ロンで全点数を返す", () => {
      const available = getAvailableScores({
        han: 1,
        isOya: true,
        isTsumo: false,
        scoreRange: "all",
      });

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toEqual(RON_SCORES_OYA);
    });

    it("親ツモで全点数を返す", () => {
      const available = getAvailableScores({
        han: 1,
        isOya: true,
        isTsumo: true,
        scoreRange: "all",
      });

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toEqual(TSUMO_SCORES_OYA_PART);
    });

    it("子ツモ（分割入力）で子・親それぞれの全点数を返す", () => {
      const available = getAvailableScores({
        han: 1,
        isOya: false,
        isTsumo: true,
        scoreRange: "all",
        koTsumoInput: "split",
      });

      expect(available.type).toBe("koTsumoSplit");
      if (available.type !== "koTsumoSplit") return;
      expect(available.koScores).toEqual(TSUMO_SCORES_KO_PART);
      expect(available.oyaScores).toEqual(TSUMO_SCORES_OYA_PART);
    });

    it("翻数によって選択肢が変わらない", () => {
      // 選択肢の個数が翻数のヒントになってはならない（試験で使う範囲のため）
      const oneHan = getAvailableScores({
        han: 1,
        isOya: false,
        isTsumo: false,
        scoreRange: "all",
      });
      const yakuman = getAvailableScores({
        han: 13,
        isOya: false,
        isTsumo: false,
        scoreRange: "all",
      });

      expect(oneHan).toEqual(yakuman);
    });

    it("切り上げ満貫の設定によって選択肢が変わらない", () => {
      // 試験は全受験者を同じ土俵で比較するため、選択肢が端末ローカルの
      // ルール設定に依存してはならない
      const standard = getAvailableScores({
        han: 4,
        isOya: false,
        isTsumo: false,
        scoreRange: "all",
        kiriageMangan: false,
      });
      const kiriage = getAvailableScores({
        han: 4,
        isOya: false,
        isTsumo: false,
        scoreRange: "all",
        kiriageMangan: true,
      });

      expect(standard).toEqual(kiriage);
    });
  });

  describe("点数帯による絞り込みとの違い", () => {
    it('"all" は満貫未満・満貫以上のどちらより広い', () => {
      const all = getAvailableScores({
        han: 1,
        isOya: false,
        isTsumo: false,
        scoreRange: "all",
      });
      const nonMangan = getAvailableScores({
        han: 1,
        isOya: false,
        isTsumo: false,
        scoreRange: "nonMangan",
      });
      const manganPlus = getAvailableScores({
        han: 1,
        isOya: false,
        isTsumo: false,
        scoreRange: "manganPlus",
      });

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
      const available = getAvailableScores({
        han: 26,
        isOya: false,
        isTsumo: false,
        kiriageMangan: false,
        doubleYakuman: true,
      });

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toContain(64000);
    });

    it("親ロンの選択肢に 96000 が足される", () => {
      const available = getAvailableScores({
        han: 26,
        isOya: true,
        isTsumo: false,
        kiriageMangan: false,
        doubleYakuman: true,
      });

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toContain(96000);
    });

    it("子ツモの選択肢に 16000 / 32000 が足される", () => {
      const available = getAvailableScores({
        han: 26,
        isOya: false,
        isTsumo: true,
        kiriageMangan: false,
        doubleYakuman: true,
        koTsumoInput: "split",
      });

      expect(available.type).toBe("koTsumoSplit");
      if (available.type !== "koTsumoSplit") return;
      expect(available.koScores).toContain(16000);
      expect(available.oyaScores).toContain(32000);
    });

    it("親ツモの選択肢に 32000 オールが足される", () => {
      const available = getAvailableScores({
        han: 26,
        isOya: true,
        isTsumo: true,
        kiriageMangan: false,
        doubleYakuman: true,
      });

      expect(available.type).toBe("single");
      if (available.type !== "single") return;
      expect(available.scores).toContain(32000);
    });

    it("採用しないとき（既定）は選択肢が変わらない", () => {
      const withoutFlag = getAvailableScores({
        han: 13,
        isOya: false,
        isTsumo: false,
      });
      const explicitOff = getAvailableScores({
        han: 13,
        isOya: false,
        isTsumo: false,
        kiriageMangan: false,
        doubleYakuman: false,
      });

      expect(explicitOff).toEqual(withoutFlag);
      if (withoutFlag.type !== "single") return;
      expect(withoutFlag.scores).not.toContain(64000);
    });
  });

  describe("子ツモ（まとめた入力）", () => {
    const keysOf = (
      params: Omit<AvailableScoresParams, "isOya" | "isTsumo">,
    ) => {
      const available = getAvailableScores({
        ...params,
        isOya: false,
        isTsumo: true,
        koTsumoInput: "combined",
      });
      if (available.type !== "koTsumoCombined") {
        throw new Error(`koTsumoCombined ではない: ${available.type}`);
      }
      return available.payments.map(koTsumoPaymentKey);
    };

    it("入力方式を省略すると組の 1 つの select になる", () => {
      expect(
        getAvailableScores({ han: 1, isOya: false, isTsumo: true }).type,
      ).toBe("koTsumoCombined");
    });

    it("満貫以上の範囲は満貫〜役満の 5 組", () => {
      expect(keysOf({ han: undefined, scoreRange: "manganPlus" })).toEqual([
        "2000/4000",
        "3000/6000",
        "4000/8000",
        "6000/12000",
        "8000/16000",
      ]);
    });

    it("2000/3900 は子・親の両方で見て満貫未満の側に入る", () => {
      expect(keysOf({ han: undefined, scoreRange: "nonMangan" })).toContain(
        "2000/3900",
      );
      expect(
        keysOf({ han: undefined, scoreRange: "manganPlus" }),
      ).not.toContain("2000/3900");
    });

    it("切り上げ満貫では 2000/3900 を出さない", () => {
      expect(keysOf({ han: 4, kiriageMangan: true })).not.toContain(
        "2000/3900",
      );
    });

    it("2 翻以下は満貫未満の組だけ", () => {
      expect(keysOf({ han: 2 })).not.toContain("2000/4000");
    });
  });

  describe("子ツモ（分割入力）の満貫境界", () => {
    it("満貫未満の範囲でも 2000/3900 の子の 2000 を残す", () => {
      const available = getAvailableScores({
        han: undefined,
        isOya: false,
        isTsumo: true,
        scoreRange: "nonMangan",
        koTsumoInput: "split",
      });
      if (available.type !== "koTsumoSplit") throw new Error(available.type);
      expect(available.koScores).toContain(2000);
      expect(available.oyaScores).toContain(3900);
      expect(available.oyaScores).not.toContain(4000);
    });
  });

  /**
   * 出題されうる正解が、その出題で出す選択肢に必ず含まれること
   *
   * 生成器のランダムな出題に頼らず、符×翻の全セルと満貫以上の全区分を
   * 1 つずつ確かめる。点数だけを答える盤面は範囲（scoreRange）で、
   * 翻・符も答える盤面は正解の翻数で選択肢を絞るので、その両方と
   * 範囲を固定しない "all" を見る。
   */
  describe("正解は必ず選択肢に含まれる", () => {
    interface Case {
      readonly label: string;
      readonly han: number;
      readonly isManganPlus: boolean;
      readonly koTsumo: { readonly fromKo: number; readonly fromOya: number };
      readonly oyaTsumo: number;
      readonly ronKo: number;
      readonly ronOya: number;
    }

    const casesFor = (kiriageMangan: boolean, doubleYakuman: boolean) => {
      const cases: Case[] = [];
      for (let han = 1; han <= 4; han++) {
        for (const fu of FU_VALUES) {
          if (
            isInvalidCell(han, fu, "tsumo") &&
            isInvalidCell(han, fu, "ron")
          ) {
            continue;
          }
          const ko = calculateKoScore(han, fu, { kiriageMangan });
          const oya = calculateOyaScore(han, fu, { kiriageMangan });
          cases.push({
            label: `${fu}符${han}翻`,
            han,
            isManganPlus: ko.isMangan,
            koTsumo: ko.tsumo,
            oyaTsumo: oya.tsumo.all,
            ronKo: ko.ron,
            ronOya: oya.ron,
          });
        }
      }
      for (const tier of MANGAN_PLUS_TIERS) {
        if (!doubleYakuman && tier.key === "doubleYakuman") continue;
        const { ko, oya } = calculateTierScore(tier);
        cases.push({
          label: tier.key,
          han: tier.minHan,
          isManganPlus: true,
          koTsumo: ko.tsumo,
          oyaTsumo: oya.tsumo.all,
          ronKo: ko.ron,
          ronOya: oya.ron,
        });
      }
      return cases;
    };

    describe.each([
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ])("切り上げ満貫=%s・ダブル役満=%s", (kiriageMangan, doubleYakuman) => {
      it.each(casesFor(kiriageMangan, doubleYakuman))("$label", (c) => {
        const range: ScoreRange = c.isManganPlus ? "manganPlus" : "nonMangan";
        const filters: readonly Pick<
          AvailableScoresParams,
          "han" | "scoreRange"
        >[] = [
          { han: c.han },
          { han: undefined, scoreRange: range },
          { han: undefined, scoreRange: "all" },
        ];
        for (const filter of filters) {
          const base = { ...filter, kiriageMangan, doubleYakuman };

          const combined = getAvailableScores({
            ...base,
            isOya: false,
            isTsumo: true,
            koTsumoInput: "combined",
          });
          if (combined.type !== "koTsumoCombined") throw new Error();
          expect(combined.payments.map(koTsumoPaymentKey)).toContain(
            koTsumoPaymentKey(c.koTsumo),
          );

          const split = getAvailableScores({
            ...base,
            isOya: false,
            isTsumo: true,
            koTsumoInput: "split",
          });
          if (split.type !== "koTsumoSplit") throw new Error();
          expect(split.koScores).toContain(c.koTsumo.fromKo);
          expect(split.oyaScores).toContain(c.koTsumo.fromOya);

          const singles: readonly [boolean, boolean, number][] = [
            [true, true, c.oyaTsumo],
            [false, false, c.ronKo],
            [true, false, c.ronOya],
          ];
          for (const [isOya, isTsumo, expected] of singles) {
            const single = getAvailableScores({ ...base, isOya, isTsumo });
            if (single.type !== "single") throw new Error();
            expect(single.scores).toContain(expected);
          }
        }
      });
    });

    it("固定ケース: 80符3翻（切り上げ満貫なし）の子ツモ 2000/4000 は 3 翻で選べる", () => {
      const available = getAvailableScores({
        han: 3,
        isOya: false,
        isTsumo: true,
        koTsumoInput: "split",
      });
      if (available.type !== "koTsumoSplit") throw new Error();
      expect(available.koScores).toContain(2000);
      expect(available.oyaScores).toContain(4000);
    });

    it("固定ケース: 60符3翻（切り上げ満貫なし）の 2000/3900 は 3 翻の分割入力で選べる", () => {
      const available = getAvailableScores({
        han: 3,
        isOya: false,
        isTsumo: true,
        koTsumoInput: "split",
      });
      if (available.type !== "koTsumoSplit") throw new Error();
      expect(available.koScores).toContain(2000);
      expect(available.oyaScores).toContain(3900);
    });
  });
});
