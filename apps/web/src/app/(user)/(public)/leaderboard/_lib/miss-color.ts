/**
 * ミス回数に応じた文字色クラスを返す。
 * 0 回はプライマリ、1 回までは控えめ、2 回以上は赤。
 * ミス数カラー
 */
export function getMissColorClass(incorrectAnswers: number): string {
  if (incorrectAnswers === 0) return "text-primary-600";
  if (incorrectAnswers <= 1) return "text-surface-500";
  return "text-red-500";
}
