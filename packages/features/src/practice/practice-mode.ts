/**
 * 練習一覧の表示の切り替え（基礎練習 / 実戦練習）。並びは切り替えの左から右
 * 練習一覧モード
 *
 * 既定（保存も指定も無いとき）は先頭の基礎練習。最後に選んだ方は各アプリが
 * 端末に残す（web は localStorage、モバイルは AsyncStorage）。
 */
export const PRACTICE_MODES = ["basic", "practical"] as const;

/** 練習一覧の表示（基礎練習 / 実戦練習） */
export type PracticeMode = (typeof PRACTICE_MODES)[number];

/** 練習一覧の既定の表示 */
export const DEFAULT_PRACTICE_MODE: PracticeMode = PRACTICE_MODES[0];

/**
 * URL・保存値など外から来た値が練習一覧の表示か
 * 練習一覧モード判定
 */
export function isPracticeMode(value: unknown): value is PracticeMode {
  return PRACTICE_MODES.some((mode) => mode === value);
}
