"use client";

import { isOya } from "@mahjong-scoring/core";
import type { ScoreQuestion, ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "../../_components/score-answer-form";

interface ScoreCalculationAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
}

/**
 * 点数計算練習の回答フォーム
 * 点数計算回答フォーム
 *
 * 点数のみを select で回答する。手牌から翻・符を自分で読み取る必要がある。
 */
export function ScoreCalculationAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
}: ScoreCalculationAnswerFormProps) {
  const oya = isOya(question.jikaze);

  return (
    <ScoreAnswerForm
      isOya={oya}
      isTsumo={question.isTsumo}
      han={question.answer.han}
      questionKey={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      translationNamespace="scoreCalculationChallenge"
    />
  );
}
