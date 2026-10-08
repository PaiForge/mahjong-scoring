import {
  AnswerOutcome,
  type JudgementVerdict,
} from "../results/result-schemas";
import { formatDifference, type AnswerDifference } from "./answer-difference";

/** 答え合わせの表 1 行。値は各アプリの描画物（ReactNode 等）をそのまま運ぶ */
export interface AnswerComparisonRow<V> {
  readonly label: string;
  readonly value: V | string;
  readonly tone?: JudgementVerdict;
}

/** 答え合わせの表（各アプリの `DetailTable` にそのまま渡す形） */
export interface AnswerComparisonTable<V> {
  readonly title: string | undefined;
  readonly rows: readonly AnswerComparisonRow<V>[];
  readonly total:
    { readonly label: string; readonly value: string } | undefined;
}

/**
 * 正解とあなたの回答の対比表を組み立てる
 * 答え合わせ表
 *
 * web とアプリの `AnswerComparison` が描く表の中身。正誤の色は回答値だけに
 * 乗せ（ラベルは常に中立色）、時間切れと無回答の開示は正誤ではないので
 * 本文色のまま。時間切れは回答が無いので回答欄に「時間切れ（未回答）」を出し、
 * 過不足の行も付けない。
 *
 * このモジュールは純粋。
 *
 * @param tResult - `<namespace>.result` の辞書を引く関数
 * @param tCommon - `common` の辞書を引く関数
 */
export function buildAnswerComparisonTable<V>({
  tResult,
  tCommon,
  correct,
  user,
  outcome,
  difference,
  showTitle,
}: {
  readonly tResult: (key: "correctAnswer" | "yourAnswer") => string;
  readonly tCommon: (
    key: "answerCheck" | "difference" | "noDifference" | "timeUpAnswer",
  ) => string;
  readonly correct: V;
  readonly user: V;
  readonly outcome: AnswerOutcome | undefined;
  readonly difference: AnswerDifference | undefined;
  readonly showTitle: boolean;
}): AnswerComparisonTable<V> {
  const isTimeUp = outcome === AnswerOutcome.TimeUp;
  return {
    title: showTitle ? tCommon("answerCheck") : undefined,
    total:
      difference === undefined || isTimeUp
        ? undefined
        : {
            label: tCommon("difference"),
            value: formatDifference(difference, tCommon("noDifference")),
          },
    rows: [
      { label: tResult("correctAnswer"), value: correct },
      {
        label: tResult("yourAnswer"),
        value: isTimeUp ? tCommon("timeUpAnswer") : user,
        tone: isTimeUp ? undefined : outcome,
      },
    ],
  };
}
