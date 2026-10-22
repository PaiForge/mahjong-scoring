import {
  type ScoreExamAnswerFormProps,
  scoreAnswerTargetOf,
} from "@mahjong-scoring/features/practice/score/score-answer-form-props";

import { ScoreAnswerForm } from "../components/score-answer-form";

/**
 * 昇級試験（点数計算）共通の回答フォーム
 * 昇級試験回答フォーム
 *
 * web の `ScoreExamAnswerForm` の移植。点数のみを選択欄で回答する。役も符も
 * 表示しないため、手牌から翻数（試験によっては符も）を自力で数え、点数表を
 * 引くところまでを受験者が通しで行う。選択肢を `scoreRange` と `fixedRules` で
 * 固定する理由は features の {@link ScoreExamAnswerFormProps} にある。
 *
 * 選択が揃った時点で送信し、「回答する」ボタンは置かない。
 */
export function ScoreExamAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
  showFeedback = false,
  lastAnswerCorrect,
  translationNamespace,
  scoreRange,
}: ScoreExamAnswerFormProps) {
  return (
    <ScoreAnswerForm
      {...scoreAnswerTargetOf(question)}
      key={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      translationNamespace={translationNamespace}
      scoreRange={scoreRange}
      autoSubmit
      fixedRules
    />
  );
}
