import type { ReactNode } from "react";

import type { AnswerOutcome } from "./result-schemas";

/**
 * 問題別フィードバック一覧（`ProblemListAccordion`）の props（web とアプリで共有）
 * 問題一覧props
 *
 * @typeParam T - 1 問の結果
 * @typeParam TSummary - 見出しに添える要約の型。web は ReactNode、アプリは文字列
 */
export interface ProblemListAccordionProps<T, TSummary = ReactNode> {
  readonly results: readonly T[];
  /** i18n の翻訳ネームスペース（result.problemDetails, result.correct, result.incorrect を含む） */
  readonly translationNamespace: string;
  /** 1 問の顛末（正解・不正解・時間切れ）を取り出す関数 */
  readonly outcome: (result: T) => AnswerOutcome;
  /** ヘッダー右側に表示するサマリー（任意） */
  readonly renderSummary?: (result: T, index: number) => TSummary;
  /** 展開時の詳細コンテンツ */
  readonly renderDetail: (result: T, index: number) => ReactNode;
}
