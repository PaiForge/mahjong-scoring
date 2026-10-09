import {
  calculateKoScore,
  calculateTierScore,
  isInvalidCell,
  type KoTsumoPayment,
} from "../core/score-calculation";
import { compareNumbers } from "../core/compare";
import { FU_VALUES } from "./constants";
import { MANGAN_MIN_HAN, MANGAN_PLUS_TIERS } from "./tiers";

/**
 * 子ツモの支払いの組を導くルール
 * 子ツモ支払いオプション
 */
export interface KoTsumoPaymentOptions {
  /** 切り上げ満貫を採用するか（採用すると 2000/3900 が満貫の 2000/4000 に吸収される） */
  readonly kiriageMangan?: boolean;
  /** ダブル役満を採用するか（採用すると 16000/32000 を足す） */
  readonly doubleYakuman?: boolean;
}

/** 満貫未満になりうる翻数（1 翻 〜 満貫の 1 つ下） */
const NON_MANGAN_HANS = Array.from(
  { length: MANGAN_MIN_HAN - 1 },
  (_, i) => i + 1,
);

/**
 * 子ツモで現れうる支払いの組（子から昇順 → 親から昇順）
 * 子ツモ支払い組
 *
 * 点数を 1 つの select で「300/500」のように答えさせるための選択肢。
 * 子の値から親の値は一意に決まらない（400/700 と 400/800、800/1500 と
 * 800/1600、2000/3900 と 2000/4000）ため、2 つの点数リストの直積や
 * 「親 = 子 × 2」では作れない。満貫未満の翻数 × {@link FU_VALUES} と
 * 満貫以上の区分をライブラリの点数計算に通し、重複を除いて並べる。
 * 点数を直書きしないのは `HIGH_SCORES` と同じ方針。
 *
 * 実在する組だけを返し、存在しない組（300/1000 等）は混ぜない。
 * 学習アプリとして、ありえない組を見せて選ばせる意味が無いため。
 */
export function koTsumoPaymentOptions({
  kiriageMangan = false,
  doubleYakuman = false,
}: KoTsumoPaymentOptions = {}): readonly KoTsumoPayment[] {
  const nonMangan = NON_MANGAN_HANS.flatMap((han) =>
    FU_VALUES.filter((fu) => !isInvalidCell(han, fu, "tsumo")).map(
      (fu) => calculateKoScore(han, fu, { kiriageMangan }).tsumo,
    ),
  );
  const tiers = MANGAN_PLUS_TIERS.filter(
    (tier) => doubleYakuman || tier.key !== "doubleYakuman",
  ).map((tier) => calculateTierScore(tier).ko.tsumo);

  const unique = new Map<string, KoTsumoPayment>();
  for (const payment of [...nonMangan, ...tiers]) {
    unique.set(koTsumoPaymentKey(payment), payment);
  }
  return [...unique.values()].sort(
    (a, b) =>
      compareNumbers(a.fromKo, b.fromKo) ||
      compareNumbers(a.fromOya, b.fromOya),
  );
}

/**
 * 子ツモの支払いの組を一意な文字列にする（例: "300/500"）
 * 子ツモ支払いキー
 *
 * select の option の value や重複除去に使う。表示用の文字列化は表示側の
 * 責務だが、子ツモの表記「子/親」は i18n に依存しないため、表示にも
 * そのまま使える。
 */
export function koTsumoPaymentKey(
  payment: Pick<KoTsumoPayment, "fromKo" | "fromOya">,
): string {
  return `${payment.fromKo}/${payment.fromOya}`;
}

/**
 * 符によっては満貫に届く最小の翻数
 * 満貫到達最小翻数
 *
 * これより下の翻数は符をどれだけ積んでも満貫未満、これ以上・満貫未満の
 * 翻数は符次第で満貫にも満貫未満にもなる。切り上げ満貫を採らなくても
 * 70符3翻は満貫に届くため、切り上げ満貫の採否でこの値は変わらない
 * （{@link FU_VALUES} の上限 110 符で計算する。2 翻は 110 符でも満貫未満）。
 */
export const LOWEST_MANGAN_REACHABLE_HAN = (() => {
  const maxFu = FU_VALUES[FU_VALUES.length - 1];
  if (maxFu === undefined) throw new Error("FU_VALUES が空");
  const han = NON_MANGAN_HANS.find((h) => calculateKoScore(h, maxFu).isMangan);
  return han ?? MANGAN_MIN_HAN;
})();
