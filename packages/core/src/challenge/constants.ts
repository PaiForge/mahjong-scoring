/**
 * チャレンジモードの制限値
 * チャレンジ制限値
 *
 * 全チャレンジ型練習で共通のルール。EXP の精度ボーナス（`MISS_BONUS`）が
 * ミス上限を前提に段数を持つため、web ではなく core に置いて
 * 両者がズレないようにしている。
 */

/** チャレンジモードの制限時間（秒） */
export const CHALLENGE_TIME_LIMIT = 60;

/** チャレンジモードの最大ミス回数（この回数に達すると終了） */
export const MISTAKE_LIMIT = 3;
