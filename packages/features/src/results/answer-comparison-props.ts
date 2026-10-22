import type { ReactNode } from "react";

import type { AnswerDifference } from "../practice/answer-difference";
import type { AnswerOutcome } from "./result-schemas";

/**
 * 「正解 / あなたの回答」の対比表示（`AnswerComparison`）の props（web とアプリで共有）
 * 回答対比props
 *
 * 各練習の問題別フィードバック（`ProblemListAccordion` の renderDetail）で
 * 共通に使う体裁。何を正解として見せるかは練習ごとに違うので、値の組み立ては
 * 呼び出し側に任せ、部品は並べ方と正誤の色分けだけを持つ
 * （行の組み立ては `practice/answer-comparison-table.ts`）。
 */
export interface AnswerComparisonProps {
  /** i18n の翻訳ネームスペース（例: "totalFu"）。ラベルは `<ns>.result` から引く */
  readonly translationNamespace: string;
  /** 正解の表示内容 */
  readonly correct: ReactNode;
  /**
   * ユーザー回答の表示内容
   *
   * 時間切れ（`outcome` が `TimeUp`）の問題では見ない — 回答欄には
   * 「時間切れ（未回答）」を出す。呼び出し側は回答が無いとき undefined を
   * 渡してよい
   */
  readonly user: ReactNode;
  /**
   * 1 問の顛末（回答値の文字色に反映する）
   *
   * 正解 / 不正解は回答値を成功 / 失敗の色にする。時間切れは回答が無いので
   * 回答欄に「時間切れ（未回答）」を本文色で出し、過不足の行も付けない。
   * トレーニングで無回答のまま正解を開示したときは undefined を渡す。
   * 答えていない回答欄に正誤の色を乗せないため、本文色のままになる。
   */
  readonly outcome: AnswerOutcome | undefined;
  /**
   * 過不足を出すための正解と回答の値。数値で答える練習（符・翻）が渡す。
   * 渡すと「過不足」の行が最後に付く。時間切れの問題では回答が無いので
   * 渡さない（渡しても付けない）
   */
  readonly difference?: AnswerDifference;
  /**
   * 「答え合わせ」の見出しを出すか（既定: true）。
   * 詳細に並ぶ表がこれ 1 つだけで、見出しがなくても何の表かが明らかな練習は
   * false にして詳細を軽くする
   */
  readonly showTitle?: boolean;
}
