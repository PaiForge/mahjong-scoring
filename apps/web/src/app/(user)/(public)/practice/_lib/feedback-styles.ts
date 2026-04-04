/**
 * ドリルの正誤フィードバック時のボーダー＋背景クラスを返す
 * フィードバック枠スタイル
 *
 * @param showFeedback - フィードバック表示中かどうか
 * @param lastAnswerCorrect - 直前の回答が正解だったか（undefined の場合はデフォルト表示）
 */
export function getFeedbackBorderClass(
  showFeedback: boolean,
  lastAnswerCorrect: boolean | undefined,
): string {
  if (!showFeedback || lastAnswerCorrect === undefined) return "border-surface-200 bg-white";
  return lastAnswerCorrect
    ? "border-green-500 bg-green-50"
    : "border-red-500 bg-red-50";
}

export function getFeedbackStyles(
  showFeedback: boolean,
  isSelected: boolean,
  isCorrect: boolean,
): { borderClass: string; bgClass: string } {
  if (!showFeedback) {
    return {
      borderClass: "border-surface-200",
      bgClass: "bg-white hover:border-primary-300",
    };
  }

  if (isCorrect) {
    return { borderClass: "border-green-500", bgClass: "bg-green-50" };
  }

  if (isSelected) {
    return { borderClass: "border-red-500", bgClass: "bg-red-50" };
  }

  return { borderClass: "border-surface-200", bgClass: "bg-white opacity-50" };
}
