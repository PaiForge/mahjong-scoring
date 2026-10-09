import { koTsumoPaymentKey } from "@mahjong-scoring/core";
import type { KoTsumoPayment } from "@mahjong-scoring/core";

/**
 * 点数の select の 1 選択肢
 * 点数選択肢
 *
 * 点数（`1000`）と子ツモの組（`300/500`）を同じ select の部品で描くため、
 * 値は文字列の key に揃える。
 */
export interface ScoreSelectOption {
  readonly value: string;
  readonly label: string;
}

/**
 * 点数のリストを select の選択肢にする
 * 点数選択肢化
 *
 * @param suffix - 各選択肢の後置文字列（親ツモの「オール」など）
 */
export function scoreSelectOptions(
  scores: readonly number[],
  suffix = "",
): readonly ScoreSelectOption[] {
  return scores.map((score) => ({
    value: String(score),
    label: `${score}${suffix}`,
  }));
}

/**
 * 子ツモの組を select の選択肢にする（値も表示も「300/500」）
 * 子ツモ組選択肢化
 */
export function koTsumoSelectOptions(
  payments: readonly KoTsumoPayment[],
): readonly ScoreSelectOption[] {
  return payments.map((payment) => {
    const key = koTsumoPaymentKey(payment);
    return { value: key, label: key };
  });
}

/**
 * 選ばれた選択肢の値から子ツモの組を引く（選択肢に無ければ undefined）
 * 子ツモ組逆引き
 */
export function koTsumoPaymentOfKey(
  payments: readonly KoTsumoPayment[],
  key: string,
): KoTsumoPayment | undefined {
  return payments.find((payment) => koTsumoPaymentKey(payment) === key);
}
