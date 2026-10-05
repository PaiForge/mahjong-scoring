/**
 * 過不足の計算に使う正解と回答の値、そして単位の付け方
 * 回答過不足
 */
export interface AnswerDifference {
  readonly correct: number;
  readonly user: number;
  /** 値に単位を付ける（`(3) => "3翻"` など。差の絶対値に対して呼ばれる） */
  readonly format: (value: number) => string;
}

/**
 * 過不足を符号付きの文字列にする
 * 過不足整形
 *
 * 差は「回答 − 正解」で、多く数えていれば +、足りなければ −。
 * 記号は演算子のマイナス（U+2212）で、ハイフンより横棒が長く数字と釣り合う。
 *
 * @param difference 正解と回答の値
 * @param noDifferenceLabel 差が無いときの文言
 */
export function formatDifference(
  { correct, user, format }: AnswerDifference,
  noDifferenceLabel: string,
): string {
  const diff = user - correct;
  if (diff === 0) return noDifferenceLabel;
  return `${diff > 0 ? "+" : "−"}${format(Math.abs(diff))}`;
}
