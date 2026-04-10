/**
 * EXP 計算定数
 * 経験値定数
 *
 * @description
 * 経験値計算に用いるモジュール重み・精度ボーナス・レベルカーブ等を定義する。
 */

/**
 * モジュール別の EXP 重み
 *
 * キーは `menuType`（ドリル種別）。このテーブルに登録されていない menuType は
 * EXP 付与対象外（`calculateExp` が `null` を返す）となる。
 * 現時点で提供中のチャレンジドリルはすべて有効化済み（重みはいずれも 1）。
 * 将来追加するドリルは、難易度を決めてから明示的にここへ追記して opt-in すること。
 */
export const MODULE_WEIGHT: Readonly<Record<string, number>> = {
  jantou_fu: 1,
  machi_fu: 1,
  mentsu_fu: 1,
  tehai_fu: 1,
  yaku: 1,
  score_table: 1,
  score_calculation: 1,
  han_count: 1,
};

/**
 * 精度ボーナス（ミス数ベース）
 *
 * チャレンジは 3 ミスで終了するため、`incorrectAnswers` は 0〜3 を想定する。
 */
export const MISS_BONUS: ReadonlyArray<{ readonly misses: number; readonly multiplier: number }> = [
  { misses: 0, multiplier: 1.5 }, // パーフェクト
  { misses: 1, multiplier: 1.2 },
  { misses: 2, multiplier: 1.1 },
  // 3 ミス（バースト）はボーナスなし（1.0）
];

/**
 * レベルカーブ: `requiredExp(level) = floor(base * level^exponent)`
 * 経験値曲線
 */
export const EXP_CURVE = { base: 100, exponent: 1.5 } as const;

/** チャレンジ完了の最低保証 EXP */
export const MIN_COMPLETION_EXP = 1;
