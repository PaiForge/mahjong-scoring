"use client";

import { HaiKind } from "@mahjong-scoring/core";
import type { DrillQuestion, ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "../../_components/score-answer-form";

interface ScoreCalculationAnswerFormProps {
  readonly question: DrillQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
}

/**
 * 点数計算ドリルの回答フォーム
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
  const isOya = question.jikaze === HaiKind.Ton;

  return (
    <ScoreAnswerForm
      isOya={isOya}
      isTsumo={question.isTsumo}
      han={question.answer.han}
      questionKey={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      translationNamespace="scoreCalculationDrill"
    />
  );
}
