/**
 * EXP 計算ロジック
 * 経験値計算
 *
 * @description
 * チャレンジ完了時に付与される経験値を計算する純粋関数。
 * DB や Next.js に依存しないためユニットテストが容易。
 *
 * @see {@link ./constants.ts} モジュール重み・精度ボーナス・レベルカーブ
 * @see {@link ./types.ts} 入出力型
 * @see {@link ./level.ts} レベルカーブ
 */
import {
  MIN_COMPLETION_EXP,
  MISS_BONUS,
  MODULE_WEIGHT,
} from "./constants";
import type { ExpInput, ExpResult } from "./types";

function getAccuracyMultiplier(incorrectAnswers: number): number {
  for (const { misses, multiplier } of MISS_BONUS) {
    if (incorrectAnswers <= misses) {
      return multiplier;
    }
  }
  return 1.0;
}

/**
 * 経験値を計算する
 * 経験値計算
 *
 * `menuType` が {@link MODULE_WEIGHT} に登録されていない場合は `null` を返し、
 * 呼び出し元で EXP 付与を完全にスキップする。
 * （デフォルト重みを使わず明示的ホワイトリスト方式にしているのは、
 *  開発中・未調整のドリルで誤って EXP が付与されるのを防ぐため）
 *
 * @param input スコア・誤答数・ドリル種別
 * @returns baseExp / accuracyMultiplier / totalExp、または未登録 menuType の場合は `null`
 */
export function calculateExp(input: ExpInput): ExpResult | null {
  const { score, incorrectAnswers, menuType } = input;

  const weight = MODULE_WEIGHT[menuType];
  if (weight === undefined) return null;

  const baseExp = score * weight;
  const accuracyMultiplier = getAccuracyMultiplier(incorrectAnswers);

  const totalExp = Math.max(
    MIN_COMPLETION_EXP,
    Math.floor(baseExp * accuracyMultiplier),
  );

  return {
    baseExp,
    accuracyMultiplier,
    totalExp,
  };
}
