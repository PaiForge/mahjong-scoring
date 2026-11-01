/**
 * レッスンの段階（並びは進む順: 本文 → 確認問題 → できたことの確認）
 * レッスン段階
 *
 * web とアプリのレッスンの進行が同じ段階を同じ名前で持つ。web は並びを
 * 履歴（戻る・進む）の順にも使う。
 */
export const LESSON_PHASES = ["learn", "quiz", "done"] as const;

/** レッスンの段階（{@link LESSON_PHASES}） */
export type LessonPhase = (typeof LESSON_PHASES)[number];
