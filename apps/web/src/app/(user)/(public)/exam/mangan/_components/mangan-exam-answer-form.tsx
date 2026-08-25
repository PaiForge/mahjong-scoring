"use client";

import { isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "@/app/(user)/(public)/practice/_components/score-answer-form";

interface ManganExamAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
}

/**
 * 昇級試験（満貫以上の点数計算）の回答フォーム
 * 昇級試験回答フォーム
 *
 * 点数のみを select で回答する。役は表示されないため、手牌から翻数を
 * 自分で数えて点数を導く。選択肢は `manganOnly` で満貫以上に固定し、
 * 選択肢の個数が翻数のヒントにならないようにする。
 */
export function ManganExamAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
}: ManganExamAnswerFormProps) {
  const oya = isOya(question.jikaze);

  return (
    <ScoreAnswerForm
      isOya={oya}
      isTsumo={question.isTsumo}
      han={question.answer.han}
      key={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      translationNamespace="manganExamChallenge"
      manganOnly
    />
  );
}
