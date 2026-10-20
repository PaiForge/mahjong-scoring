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

/**
 * 回答があるときだけ過不足の値を組む
 * 回答過不足生成
 *
 * 時間切れなどで回答が無い問題は過不足を出さないので undefined を返す
 * （`AnswerComparison` の `difference` にそのまま渡せる）。
 *
 * @param correct 正解の値
 * @param user 回答の値（無回答なら undefined）
 * @param format 値に単位を付ける関数
 */
export function answerDifferenceOf(
  correct: number,
  user: number | undefined,
  format: (value: number) => string,
): AnswerDifference | undefined {
  return user === undefined ? undefined : { correct, user, format };
}

/**
 * 答え合わせの対比に渡す、正解と回答の文言と過不足
 * 回答対比の値
 *
 * `AnswerComparison`（web / アプリ）の `correct` / `user` / `difference` に
 * そのまま広げる。
 */
export interface NumericAnswerComparison {
  readonly correct: string;
  /** 回答が無ければ undefined（対比は無回答として描く） */
  readonly user: string | undefined;
  /** 回答が無ければ undefined（過不足を出さない） */
  readonly difference: AnswerDifference | undefined;
}

/**
 * 数値の正解と回答から、答え合わせの対比に渡す 3 つを組む
 * 回答対比生成
 *
 * 符・翻数の問題リストはどれも「正解の文言・回答の文言（無回答なら無し）・
 * 過不足（無回答なら無し）」の 3 つを同じ規則で組むので、ここに 1 つ置く。
 *
 * @param correct 正解の値
 * @param user 回答の値（無回答なら undefined）
 * @param label 値を文言にする（`(30) => "30符"` など）
 * @param differenceFormat 過不足の値に単位を付ける。省くと `label` と同じ
 */
export function numericAnswerComparison(
  correct: number,
  user: number | undefined,
  label: (value: number) => string,
  differenceFormat: (value: number) => string = label,
): NumericAnswerComparison {
  return {
    correct: label(correct),
    user: user === undefined ? undefined : label(user),
    difference: answerDifferenceOf(correct, user, differenceFormat),
  };
}
