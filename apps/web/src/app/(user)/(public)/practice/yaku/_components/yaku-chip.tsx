interface YakuChipProps {
  /** 画面に出す表示名。選択モーダルと同じ名前を出すため呼び出し側で解決する */
  readonly label: string;
  /** その役をどう扱ったか（{@link getChipFeedbackState} が決める） */
  readonly feedbackState: YakuChipFeedbackState;
}

/**
 * 答え合わせでのその役の扱い
 * 役チップ状態
 *
 * `correct` は選べた役、`incorrect` は余分に選んだ役、`missed` は選び忘れた役。
 */
export type YakuChipFeedbackState = "correct" | "incorrect" | "missed";

const CHIP_CLASSES: Readonly<Record<YakuChipFeedbackState, string>> = {
  correct: "border-primary-500 bg-primary-50 text-primary-700",
  incorrect: "border-destructive bg-destructive-subtle text-destructive-strong",
  missed: "border-warning bg-warning-subtle text-warning-strong",
};

/**
 * 答え合わせの役チップ
 * 役チップ
 *
 * 表示専用。役を選ぶのは {@link import("./yaku-picker").YakuPicker } の
 * 役目で、答え合わせで並ぶこのチップは押せない。
 */
export function YakuChip({ label, feedbackState }: YakuChipProps) {
  return (
    <span
      className={`inline-block rounded-full border px-3 py-1.5 text-xs font-medium select-none ${CHIP_CLASSES[feedbackState]}`}
    >
      {label}
    </span>
  );
}

/**
 * 各役のフィードバック状態を計算する
 * フィードバック状態計算
 *
 * 答え合わせに並ぶ役は「選んだ役」か「成立していた役」のどちらかなので、
 * 3つの状態のいずれかに必ず当てはまる。
 */
export function getChipFeedbackState(
  yakuName: string,
  selectedYaku: ReadonlySet<string>,
  correctYakuNames: readonly string[],
): YakuChipFeedbackState {
  const isCorrect = correctYakuNames.includes(yakuName);
  if (selectedYaku.has(yakuName)) return isCorrect ? "correct" : "incorrect";
  return "missed";
}
