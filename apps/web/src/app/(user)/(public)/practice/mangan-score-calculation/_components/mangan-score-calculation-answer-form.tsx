"use client";

import { isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "../../_components/score-answer-form";

interface ManganScoreCalculationAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /** 正誤フィードバック表示中か（セッションから受け取る） */
  readonly showFeedback?: boolean;
  /** 直前の回答が正解だったか（未回答・無回答の正解開示中は undefined） */
  readonly lastAnswerCorrect?: boolean;
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
  showFeedback = false,
  lastAnswerCorrect,
}: ManganScoreCalculationAnswerFormProps) {
  const oya = isOya(question.jikaze);

  return (
    <ScoreAnswerForm
      isOya={oya}
      isTsumo={question.isTsumo}
      han={question.answer.han}
      key={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      translationNamespace="manganScoreCalculationChallenge"
      scoreRange="manganPlus"
    />
  );
}
