/**
 * 記録が残るチャレンジを端末ローカルのルール設定から独立させる
 * ルール境界の固定
 *
 * `/preferences` のルール設定（切り上げ満貫・ダブル役満の形・複合役満）は
 * 端末ごとの永続値で、`leaderboard_key` には載せない（端末を変えた瞬間に
 * 記録が別の土俵へ飛ぶため）。その代わり、記録が残るチャレンジでは
 * 設定の採否で有利不利が出ないよう次の 2 つを固定する:
 *
 * 1. **出題** — 設定次第で正解が割れる手（30符4翻・60符3翻、
 *    四暗刻単騎・複合役満等）を出題から落とす。昇級試験と同じ手法
 *    （`excludeKiriageBoundary` / `excludeYakumanRuleBoundary`）
 * 2. **選択肢** — 点数の select を設定に依らない集合にする
 *    （切り上げ満貫 ON で 3 翻の選択肢が広がる、ダブル役満 ON で 64000 が
 *    増える、といった差を消す）。境界の手を出さない以上、正解がその差の
 *    中に落ちることはない
 *
 * トレーニングは記録が残らないので設定どおりに出題・採点し、境界の手も
 * 出す（連風牌4符も含め、自分のルールで練習できることを優先する）。
 *
 * 連風牌4符は固定しない。1 択が別の 1 択に変わるだけで難易度が動かないため、
 * 設定どおりに採点して同じ土俵に載せる。
 */

/** 生成オプションのうち、境界の手を落とすフラグ */
export interface RuleBoundaryExclusions {
  readonly excludeKiriageBoundary: boolean;
  readonly excludeYakumanRuleBoundary: boolean;
}

/**
 * モードに応じた境界除外フラグ
 * 境界除外フラグ
 *
 * チャレンジ（`isTraining` が false）で両方 true、トレーニングで両方 false。
 * 点数計算系の盤面は生成オプションにこれを展開する。
 */
export function ruleBoundaryExclusions(
  isTraining: boolean,
): RuleBoundaryExclusions {
  return {
    excludeKiriageBoundary: !isTraining,
    excludeYakumanRuleBoundary: !isTraining,
  };
}
