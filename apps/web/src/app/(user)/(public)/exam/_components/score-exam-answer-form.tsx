"use client";

import { ScoreAnswerForm } from "@/app/(user)/(public)/practice/_components/score-answer-form";
import {
  type ScoreExamAnswerFormProps,
  scoreAnswerTargetOf,
} from "@mahjong-scoring/features/practice/score/score-answer-form-props";

/**
 * 昇級試験（点数計算）共通の回答フォーム
 * 昇級試験回答フォーム
 *
 * 点数のみを select で回答する。役も符も表示しないため、手牌から翻数（試験に
 * よっては符も）を自力で数え、点数表を引くところまでを受験者が通しで行う。
 * 選択肢を `scoreRange` と `fixedRules` で固定する理由は features の
 * {@link ScoreExamAnswerFormProps} にある。
 *
 * 選択が揃った時点で送信し、「回答する」ボタンは置かない（理由は
 * {@link ScoreAnswerForm} の `autoSubmit`。点数を select で答える練習と
 * 同じ作法）。
 *
 * 回答直後は select の枠と地が正誤を返すが、正解の点数はその場では出さない。
 * 試験の答え合わせは結果ページの問題別フィードバック一覧の役目。
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
