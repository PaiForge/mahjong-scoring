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
 * 開発中・未調整のドリルで誤って EXP を付与しないための明示的なホワイトリスト。
 * 新しいドリルを EXP 付与対象に加える際は、難易度を決めてからここに追記する。
 */
export const MODULE_WEIGHT: Readonly<Record<string, number>> = {
  jantou_fu: 1,
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
