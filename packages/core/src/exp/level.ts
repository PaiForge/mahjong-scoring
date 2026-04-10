/**
 * レベルカーブ
 * 経験値レベル
 *
 * @description
 * 累計 EXP とレベルの相互変換を行う純粋関数群。
 */
import { EXP_CURVE } from "./constants";
import type { LevelProgress } from "./types";

/**
 * 指定レベルに必要な累計 EXP を返す
 * 必要経験値
 *
 * `requiredExp(level) = floor(base * level^exponent)`
 *
 * @param level レベル（0 以下は 0 を返す）
 */
export function getExpForLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(EXP_CURVE.base * Math.pow(level, EXP_CURVE.exponent));
}

/**
 * 累計 EXP から現在のレベルを算出する
 * レベル算出
 *
 * @param totalExp 累計 EXP
 */
export function getLevel(totalExp: number): number {
  if (totalExp <= 0) return 0;
  const rawLevel = Math.pow(totalExp / EXP_CURVE.base, 1 / EXP_CURVE.exponent);
  const level = Math.floor(rawLevel);

  // 浮動小数点の丸め誤差を考慮: 境界付近は ±1 再チェック
  if (getExpForLevel(level + 1) <= totalExp) {
    return level + 1;
  }
  if (getExpForLevel(level) > totalExp) {
    return level - 1;
  }
  return level;
}

/**
 * レベル進捗情報を返す
 * レベル進捗
 *
 * @param totalExp 累計 EXP
 */
export function getLevelProgress(totalExp: number): LevelProgress {
  const level = getLevel(totalExp);
  const currentLevelExp = getExpForLevel(level);
  const nextLevelExp = getExpForLevel(level + 1);

  // 負の totalExp（破損データ等）で progress がマイナスにならないよう
  // 分子をクランプする。分母は非負 EXP 入力では `totalExp < nextLevelExp` が
  // 成り立つため上限クランプは不要。
  const expInCurrentLevel = Math.max(0, totalExp - currentLevelExp);
  const expNeededForNext = nextLevelExp - currentLevelExp;

  const progress =
    expNeededForNext > 0 ? expInCurrentLevel / expNeededForNext : 0;

  return {
    level,
    currentLevelExp,
    nextLevelExp,
    progress,
  };
}
