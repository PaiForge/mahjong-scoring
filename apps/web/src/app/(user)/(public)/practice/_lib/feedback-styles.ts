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
