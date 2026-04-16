"use client";

import { HaiKind } from "@mahjong-scoring/core";
import type { ScoreQuestion, ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "../../_components/score-answer-form";

interface ManganScoreCalculationAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
}

/**
 * 満貫以上点数計算ドリルの回答フォーム
 * 満貫以上点数計算回答フォーム
 *
 * 点数のみを select で回答する。役と翻数は画面に表示されている。
 */
export function ManganScoreCalculationAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
}: ManganScoreCalculationAnswerFormProps) {
  const isOya = question.jikaze === HaiKind.Ton;

  return (
    <ScoreAnswerForm
      isOya={isOya}
      isTsumo={question.isTsumo}
      han={question.answer.han}
      questionKey={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      translationNamespace="manganScoreCalculationChallenge"
    />
  );
}
