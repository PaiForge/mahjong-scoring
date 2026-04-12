"use client";

import type { ScoreTableQuestion, ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "../../_components/score-answer-form";

interface ScoreTableAnswerFormProps {
  readonly question: ScoreTableQuestion;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
}

/**
 * 点数表早引きドリルの回答フォーム
 * 点数表回答フォーム
 *
 * 点数のみを select で回答する。翻・符は問題文として表示されるため入力不要。
 */
export function ScoreTableAnswerForm({
  question,
  onSubmit,
  disabled = false,
}: ScoreTableAnswerFormProps) {
  return (
    <ScoreAnswerForm
      isOya={question.isOya}
      isTsumo={question.isTsumo}
      han={question.han}
      questionKey={question.id}
      onSubmit={onSubmit}
      disabled={disabled}
      translationNamespace="scoreTableChallenge"
    />
  );
}
