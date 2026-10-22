"use client";

import type { ScoreTableAnswerFormProps } from "@mahjong-scoring/features/practice/score/score-answer-form-props";
import { ScoreAnswerForm } from "../../_components/score-answer-form";

/**
 * 点数表早引き練習の回答フォーム
 * 点数表回答フォーム
 *
 * 点数のみを select で回答する。翻・符は問題文として表示されるため入力不要。
 * チャレンジ（記録あり）では選択肢を端末のルール設定に依らない集合に固定する
 * （`fixedRules`。理由は `_lib/rule-boundary.ts`）。
 */
export function ScoreTableAnswerForm({
  question,
  onSubmit,
  disabled = false,
  isTraining = false,
}: ScoreTableAnswerFormProps) {
  return (
    <ScoreAnswerForm
      isOya={question.isOya}
      isTsumo={question.isTsumo}
      han={question.han}
      key={question.id}
      onSubmit={onSubmit}
      disabled={disabled}
      translationNamespace="scoreTableChallenge"
      autoSubmit
      fixedRules={!isTraining}
    />
  );
}
