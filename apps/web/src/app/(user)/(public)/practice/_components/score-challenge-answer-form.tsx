"use client";

import { allowsDoubleYakuman } from "@mahjong-scoring/core";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import {
  type ScoreChallengeAnswerFormProps,
  scoreAnswerTargetOf,
} from "@mahjong-scoring/features/practice/score/score-answer-form-props";
import { ScoreAnswerForm } from "./score-answer-form";

/**
 * 点数計算チャレンジ共通の回答フォーム
 * 点数計算チャレンジ回答フォーム
 *
 * 点数のみを select で回答する。親子・ツモロンの別は出題（`question`）から
 * 導くので、呼び出し側は渡さない。選択が揃った時点で送信し、「回答する」
 * ボタンは置かない（理由は {@link ScoreAnswerForm} の `autoSubmit`）。
 *
 * トレーニングでは、選択肢にダブル役満の点数（子64000点等）を端末のルール
 * 設定に従って足す。チャレンジ（記録あり）では選択肢を設定に依らない集合に
 * 固定する（`fixedRules`。理由は `_lib/rule-boundary.ts`）。
 * 昇級試験の回答フォーム（exam/_components/score-exam-answer-form.tsx）は
 * 見た目が同じでもここを共有しない。試験はルール設定を読まないことが
 * あちらの仕様で、統合すると片方の前提が崩れる。
 */
export function ScoreChallengeAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
  showFeedback = false,
  lastAnswerCorrect,
  translationNamespace,
  scoreRange,
  isTraining = false,
}: ScoreChallengeAnswerFormProps) {
  // トレーニングでダブル役満採用時のみ、その点数（子64000点等）を選択肢に足す
  const yakumanRules = useYakumanRules();
  const allowDoubleYakuman = isTraining && allowsDoubleYakuman(yakumanRules);

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
      allowDoubleYakuman={allowDoubleYakuman}
      autoSubmit
      fixedRules={!isTraining}
    />
  );
}
