/**
 * 練習の正誤フィードバック時のボーダー＋背景クラスを返す
 * フィードバック枠スタイル
 *
 * @param showFeedback - フィードバック表示中かどうか
 * @param lastAnswerCorrect - 直前の回答が正解だったか（undefined の場合はデフォルト表示）
 */
export function getFeedbackBorderClass(
  showFeedback: boolean,
  lastAnswerCorrect: boolean | undefined,
): string {
  if (!showFeedback || lastAnswerCorrect === undefined)
    return "border-surface-200 bg-white";
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

/**
 * 選択肢ボタンに渡すフィードバック関連の props をまとめて組み立てる
 * 選択肢フィードバックprops
 *
 * 選択肢グリッドを持つ盤面（雀頭符・面子符・待ち符など）で共通の
 * 「正誤の配色 + カウントダウン/フィードバック中は押させない」を1箇所にする。
 * グリッドの列数や中身は盤面ごとに違うため、コンポーネントには寄せていない。
 */
export function getChoiceFeedbackProps(params: {
  readonly showFeedback: boolean;
  readonly isCountingDown: boolean;
  readonly isSelected: boolean;
  readonly isCorrect: boolean;
}): {
  readonly borderClass: string;
  readonly bgClass: string;
  readonly disabled: boolean;
} {
  const { showFeedback, isCountingDown, isSelected, isCorrect } = params;
  return {
    ...getFeedbackStyles(showFeedback, isSelected, isCorrect),
    disabled: showFeedback || isCountingDown,
  };
}
