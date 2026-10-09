import { describe, expect, it } from "vitest";
import {
  calculateKoScore,
  calculateTierScore,
  isInvalidCell,
} from "../core/score-calculation";
import { FU_VALUES } from "./constants";
import {
  koTsumoPaymentKey,
  koTsumoPaymentOptions,
  LOWEST_MANGAN_REACHABLE_HAN,
} from "./ko-tsumo-payments";
import { MANGAN_PLUS_TIERS } from "./tiers";

const keysOf = (options: Parameters<typeof koTsumoPaymentOptions>[0]) =>
  koTsumoPaymentOptions(options).map(koTsumoPaymentKey);

describe("koTsumoPaymentOptions", () => {
  it("切り上げ満貫なし・ダブル役満なしの組を子→親の昇順で返す", () => {
    expect(keysOf({})).toEqual([
      "300/500",
      "400/700",
      "400/800",
      "500/1000",
      "600/1200",
      "700/1300",
      "800/1500",
      "800/1600",
      "900/1800",
      "1000/2000",
      "1200/2300",
      "1300/2600",
      "1500/2900",
      "1600/3200",
      "1800/3600",
      "2000/3900",
      "2000/4000",
      "3000/6000",
      "4000/8000",
      "6000/12000",
      "8000/16000",
    ]);
  });

  it("切り上げ満貫では 2000/3900 が無くなる", () => {
    const keys = keysOf({ kiriageMangan: true });

    expect(keys).not.toContain("2000/3900");
    expect(keys).toHaveLength(20);
  });

  it("ダブル役満の採用で 16000/32000 が足される", () => {
    expect(keysOf({ doubleYakuman: true })).toContain("16000/32000");
    expect(keysOf({})).not.toContain("16000/32000");
  });

  it.each([false, true])(
    "切り上げ満貫=%s の全セル・全区分の子ツモの点数を含む",
    (kiriageMangan) => {
      const keys = keysOf({ kiriageMangan, doubleYakuman: true });
      for (let han = 1; han <= 4; han++) {
        for (const fu of FU_VALUES) {
          if (isInvalidCell(han, fu, "tsumo")) continue;
          const { tsumo } = calculateKoScore(han, fu, { kiriageMangan });
          expect(keys).toContain(koTsumoPaymentKey(tsumo));
        }
      }
      for (const tier of MANGAN_PLUS_TIERS) {
        expect(keys).toContain(
          koTsumoPaymentKey(calculateTierScore(tier).ko.tsumo),
        );
      }
    },
  );
});

describe("LOWEST_MANGAN_REACHABLE_HAN", () => {
  it("3 翻（70 符 3 翻は切り上げ満貫なしでも満貫）", () => {
    expect(LOWEST_MANGAN_REACHABLE_HAN).toBe(3);
    expect(calculateKoScore(3, 70).isMangan).toBe(true);
    expect(calculateKoScore(2, 110).isMangan).toBe(false);
  });
});
