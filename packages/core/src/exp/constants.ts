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
 * キーは `menuType`（練習種別）。このテーブルに登録されていない menuType は
 * EXP 付与対象外（`calculateExp` が `undefined` を返す）となる。
 * 現時点で提供中のチャレンジ練習はすべて有効化済み（重みはいずれも 1）。
 * 将来追加する練習は、難易度を決めてから明示的にここへ追記して opt-in すること。
 *
 * core は web のレジストリに依存できないためキーは string 型だが、
 * `PRACTICE_MENU_REGISTRY` との網羅性は web 側の
 * `lib/db/__tests__/exp-module-weight.test.ts` が検証している。
 */
export const MODULE_WEIGHT: Readonly<Record<string, number>> = {
  jantou_fu: 1,
  machi_fu: 1,
  mentsu_fu: 1,
  tehai_fu: 1,
  total_fu: 1,
  yaku: 1,
  score_table: 1,
  score_calculation: 1,
  han_count: 1,
  yaku_han: 1,
  mangan_score_calculation: 1,
  mangan_exam: 1,
};

/**
 * 精度ボーナス（ミス数ベース）
 *
 * チャレンジは MISTAKE_LIMIT ミスで終了するため、ボーナスが付くのは
 * 0〜MISTAKE_LIMIT-1 ミス。倍率は手で調整した値のため導出できないが、
 * 段数と上限の対応は `calc.test.ts` が検証する。
 */
export const MISS_BONUS: ReadonlyArray<{
  readonly misses: number;
  readonly multiplier: number;
}> = [
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
