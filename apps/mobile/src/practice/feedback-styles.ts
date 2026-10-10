import type { ViewStyle } from "react-native";

import { colors } from "../lib/theme";

/**
 * 盤面の枠の正誤配色（web の `getFeedbackBorderClass`）
 * フィードバック枠スタイル
 */
export function feedbackFrameStyle(
  showFeedback: boolean,
  lastAnswerCorrect: boolean | undefined,
): ViewStyle {
  if (!showFeedback || lastAnswerCorrect === undefined)
    return { borderColor: colors.panel, backgroundColor: colors.white };
  return lastAnswerCorrect
    ? { borderColor: colors.success, backgroundColor: colors.successSubtle }
    : {
        borderColor: colors.destructive,
        backgroundColor: colors.destructiveSubtle,
      };
}

/**
 * 選択肢ボタンの正誤配色（web の `getFeedbackStyles`）
 * 選択肢配色
 *
 * 押した選択肢は正誤が付く前から色を変え、正誤が出たら正解を緑、選んだ
 * 不正解を赤、それ以外を薄くする。枠はフォーム部品と同じ一段濃い灰。
 */
export function choiceFeedbackStyle(
  showFeedback: boolean,
  isSelected: boolean,
  isCorrect: boolean,
): ViewStyle {
  if (!showFeedback) {
    return isSelected
      ? { borderColor: colors.surface400, backgroundColor: colors.primary100 }
      : { borderColor: colors.surface300, backgroundColor: colors.white };
  }
  if (isCorrect) {
    return {
      borderColor: colors.success,
      backgroundColor: colors.successSubtle,
    };
  }
  if (isSelected) {
    return {
      borderColor: colors.destructive,
      backgroundColor: colors.destructiveSubtle,
    };
  }
  return {
    borderColor: colors.surface300,
    backgroundColor: colors.white,
    opacity: 0.5,
  };
}

/**
 * 選択肢ボタンに渡す配色と無効状態をまとめて組み立てる
 * 選択肢フィードバックprops
 *
 * カウントダウン中とフィードバック中は押させない。
 */
export function choiceFeedbackProps(params: {
  readonly showFeedback: boolean;
  readonly isCountingDown: boolean;
  readonly isSelected: boolean;
  readonly isCorrect: boolean;
}): { readonly feedbackStyle: ViewStyle; readonly disabled: boolean } {
  const { showFeedback, isCountingDown, isSelected, isCorrect } = params;
  return {
    feedbackStyle: choiceFeedbackStyle(showFeedback, isSelected, isCorrect),
    disabled: showFeedback || isCountingDown,
  };
}
