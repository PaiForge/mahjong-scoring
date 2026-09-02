import { getFeedbackBorderClass } from "./feedback-styles";

/**
 * 回答直後に select が返す正誤
 * セレクト正誤状態
 *
 * セッション（{@link import("../_hooks/use-timed-session").useTimedSession} /
 * {@link import("../_hooks/use-training-session").useTrainingSession}）の同名の
 * 値をそのまま渡す。`lastAnswerCorrect` が undefined の間（未回答・無回答の
 * 正解開示中）は色を付けない。
 */
export interface SelectFeedbackState {
  readonly showFeedback: boolean;
  readonly lastAnswerCorrect: boolean | undefined;
}

/**
 * select 要素の共通スタイルクラスを返す
 * セレクトボックス共通スタイル
 *
 * 点数を select で答える練習・試験では、選択肢ボタンのように候補を1つずつ
 * 染め分けられない。回答した select 自身の枠と地を正誤の色にすることで、
 * 選択肢を持つ練習（符・翻・役）と同じ配色で同じタイミングの答えを返す。
 * 枠を増やさないので、手牌の盤面を
 * {@link import("../_components/feedback-frame").FeedbackFrame} で囲んだときの
 * 二重枠（狭い画面で手牌が縮む）にはならない。
 *
 * @param hasValue - 値が選択済みかどうか
 * @param feedback - 回答直後の正誤（正誤を返さない画面では省略する）
 */
export function getSelectClass(
  hasValue: boolean,
  feedback?: SelectFeedbackState,
): string {
  const showsFeedback =
    feedback !== undefined &&
    feedback.showFeedback &&
    feedback.lastAnswerCorrect !== undefined;
  // 回答を送ると select は disabled になるため、正誤を返している間だけ
  // disabled のグレーを外す（付けたままだと正誤の地の色を塗り潰す）
  const surfaceClass = showsFeedback
    ? getFeedbackBorderClass(true, feedback.lastAnswerCorrect)
    : "border-ink bg-white disabled:bg-surface-100";

  return `w-full rounded-lg border-3 px-2 py-3 text-sm transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500 ${surfaceClass} ${
    hasValue ? "text-surface-900" : "text-surface-400"
  }`;
}
