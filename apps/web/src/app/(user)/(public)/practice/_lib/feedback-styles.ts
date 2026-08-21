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
    return "border-ink bg-white";
  return lastAnswerCorrect
    ? "border-green-600 bg-green-100"
    : "border-red-600 bg-red-100";
}

export function getFeedbackStyles(
  showFeedback: boolean,
  isSelected: boolean,
  isCorrect: boolean,
): { borderClass: string; bgClass: string } {
  if (!showFeedback) {
    return {
      borderClass: "border-ink",
      bgClass: "bg-white hover:bg-primary-50",
    };
  }

  if (isCorrect) {
    return { borderClass: "border-green-600", bgClass: "bg-green-100" };
  }

  if (isSelected) {
    return { borderClass: "border-red-600", bgClass: "bg-red-100" };
  }

  return { borderClass: "border-ink", bgClass: "bg-white opacity-50" };
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
