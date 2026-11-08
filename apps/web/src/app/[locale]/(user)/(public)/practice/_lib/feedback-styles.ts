import {
  type ChoiceFeedbackTone,
  type FrameFeedbackTone,
  choiceFeedbackTone,
  frameFeedbackTone,
} from "@mahjong-scoring/features/practice/feedback-tone";

/** 盤面の枠のトーン → ボーダー＋背景クラス */
const FRAME_CLASSES: Readonly<Record<FrameFeedbackTone, string>> = {
  idle: "border-panel bg-white",
  correct: "border-success bg-success-subtle",
  wrong: "border-destructive bg-destructive-subtle",
};

/**
 * 練習の正誤フィードバック時のボーダー＋背景クラスを返す
 * フィードバック枠スタイル
 *
 * 状態の判定は `frameFeedbackTone`（モバイルと共通）。
 *
 * @param showFeedback - フィードバック表示中かどうか
 * @param lastAnswerCorrect - 直前の回答が正解だったか（undefined の場合はデフォルト表示）
 */
export function getFeedbackBorderClass(
  showFeedback: boolean,
  lastAnswerCorrect: boolean | undefined,
): string {
  return FRAME_CLASSES[frameFeedbackTone(showFeedback, lastAnswerCorrect)];
}

/**
 * 選択肢のトーン → ボーダー＋背景クラス
 *
 * `pending`（押してから正誤が返るまで）の塗りは正誤のどちらとも読めない
 * 灰色（`bg-pending`。select で答える盤面が待ち中に出す
 * `disabled:bg-surface-100` と同じ）に限る。以前はブランドの緑
 * （`bg-primary-100`）を使っていたが、その値は正解の塗り `bg-success-subtle`
 * と同じ色で、不正解だったときに「緑で正解になってから赤に変わる」ように
 * 見えた（2026-10 に本番で報告）。
 */
const CHOICE_CLASSES: Readonly<
  Record<ChoiceFeedbackTone, { borderClass: string; bgClass: string }>
> = {
  idle: {
    borderClass: "border-surface-300 hover:border-surface-400",
    bgClass: "bg-white hover:bg-surface-50",
  },
  pending: { borderClass: "border-pending-border", bgClass: "bg-pending" },
  correct: { borderClass: "border-success", bgClass: "bg-success-subtle" },
  wrong: {
    borderClass: "border-destructive",
    bgClass: "bg-destructive-subtle",
  },
  dimmed: { borderClass: "border-surface-300", bgClass: "bg-white opacity-50" },
};

/**
 * 選択肢ボタンのボーダー＋背景クラスを返す
 * 選択肢配色
 *
 * 状態の判定（採点待ち → 正解 → 選んだ不正解 → それ以外）は
 * `choiceFeedbackTone`（モバイルと共通）。
 */
export function getFeedbackStyles(
  showFeedback: boolean,
  isSelected: boolean,
  isCorrect: boolean,
): { borderClass: string; bgClass: string } {
  return CHOICE_CLASSES[
    choiceFeedbackTone(showFeedback, isSelected, isCorrect)
  ];
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
