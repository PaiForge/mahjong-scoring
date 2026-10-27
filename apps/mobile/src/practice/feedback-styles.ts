import type { ViewStyle } from "react-native";
import {
  type ChoiceFeedbackTone,
  type FrameFeedbackTone,
  choiceFeedbackTone,
  frameFeedbackTone,
} from "@mahjong-scoring/features/practice/feedback-tone";

import { colors } from "../lib/theme";

/** 盤面の枠のトーン → 枠と地の色 */
const FRAME_STYLES: Readonly<Record<FrameFeedbackTone, ViewStyle>> = {
  idle: { borderColor: colors.panel, backgroundColor: colors.white },
  correct: {
    borderColor: colors.success,
    backgroundColor: colors.successSubtle,
  },
  wrong: {
    borderColor: colors.destructive,
    backgroundColor: colors.destructiveSubtle,
  },
};

/**
 * 盤面の枠の正誤配色（web の `getFeedbackBorderClass`）
 * フィードバック枠スタイル
 *
 * 状態の判定は `frameFeedbackTone`（web と共通）。
 */
export function feedbackFrameStyle(
  showFeedback: boolean,
  lastAnswerCorrect: boolean | undefined,
): ViewStyle {
  return FRAME_STYLES[frameFeedbackTone(showFeedback, lastAnswerCorrect)];
}

/**
 * 選択肢のトーン → 枠と地の色
 *
 * 待機中の枠はフォーム部品と同じ一段濃い灰。採点待ちは正誤のどちらとも
 * 読めない灰（`pending`）。
 */
const CHOICE_STYLES: Readonly<Record<ChoiceFeedbackTone, ViewStyle>> = {
  idle: { borderColor: colors.surface300, backgroundColor: colors.white },
  pending: {
    borderColor: colors.pendingBorder,
    backgroundColor: colors.pending,
  },
  correct: {
    borderColor: colors.success,
    backgroundColor: colors.successSubtle,
  },
  wrong: {
    borderColor: colors.destructive,
    backgroundColor: colors.destructiveSubtle,
  },
  dimmed: {
    borderColor: colors.surface300,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
};

/**
 * 選択肢ボタンの正誤配色（web の `getFeedbackStyles`）
 * 選択肢配色
 *
 * 状態の判定（採点待ち → 正解 → 選んだ不正解 → それ以外）は
 * `choiceFeedbackTone`（web と共通）。
 */
export function choiceFeedbackStyle(
  showFeedback: boolean,
  isSelected: boolean,
  isCorrect: boolean,
): ViewStyle {
  return CHOICE_STYLES[choiceFeedbackTone(showFeedback, isSelected, isCorrect)];
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
