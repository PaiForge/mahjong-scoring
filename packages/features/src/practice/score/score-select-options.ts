import { koTsumoPaymentKey } from "@mahjong-scoring/core";
import type { KoTsumoPayment } from "@mahjong-scoring/core";

import type { SingleInputScores } from "./get-available-scores";

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

/**
 * 点数のタイルの選択中の値（点数か、子ツモの組の key）
 * 点数タイル選択値
 *
 * タイルは選択肢と同じ文字列の key で選択中を見分ける。まとめた子ツモは
 * 組の key（`300/500`）、それ以外は点数の文字列。
 *
 * @param available - タイルに並べる選択肢
 * @param score - 選んでいる点数
 * @param koTsumoPayment - 選んでいる子ツモの組
 */
export function scoreTileValue(
  available: SingleInputScores,
  score: number | undefined,
  koTsumoPayment: KoTsumoPayment | undefined,
): string | undefined {
  return available.type === "koTsumoCombined"
    ? koTsumoPayment && koTsumoPaymentKey(koTsumoPayment)
    : score?.toString();
}

/** 点数のタイルで選ばれた値を受け取る先 */
export interface ScoreTileChoiceHandlers {
  /** 点数を選んだ（`single`） */
  readonly onScore: (score: number) => void;
  /** 子ツモの組を選んだ（`koTsumoCombined`） */
  readonly onKoTsumoPayment: (payment: KoTsumoPayment) => void;
}

/**
 * 点数のタイルで選ばれた key を、点数か子ツモの組に戻して渡す
 * 点数タイル選択適用
 *
 * {@link scoreTileValue} の逆。組が選択肢に無い key なら何もしない。
 *
 * @param available - タイルに並べた選択肢
 * @param key - 選ばれたタイルの key
 * @param handlers - 戻した値の受け取り先
 */
export function applyScoreTileChoice(
  available: SingleInputScores,
  key: string,
  handlers: ScoreTileChoiceHandlers,
): void {
  if (available.type === "single") {
    handlers.onScore(Number(key));
    return;
  }
  const payment = koTsumoPaymentOfKey(available.payments, key);
  if (payment) handlers.onKoTsumoPayment(payment);
}
