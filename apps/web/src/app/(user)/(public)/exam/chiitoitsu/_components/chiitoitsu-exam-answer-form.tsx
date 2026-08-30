"use client";

import { isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "@/app/(user)/(public)/practice/_components/score-answer-form";

interface ChiitoitsuExamAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
}

/**
 * 昇級試験（七対子の点数計算）の回答フォーム
 * 昇級試験回答フォーム
 *
 * 点数のみを select で回答する。役は表示されないため、手牌から翻数を
 * 自分で数え、25符の点数表から点数を導く。選択肢は `scoreRange` で満貫未満に
 * 固定する — 翻数から絞ると選択肢の個数が翻数のヒントになり、さらに 4翻の
 * 境界が切り上げ満貫の端末設定で動いて受験者ごとに選択肢が変わってしまう。
 */
export function ChiitoitsuExamAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
}: ChiitoitsuExamAnswerFormProps) {
  const oya = isOya(question.jikaze);

  return (
    <ScoreAnswerForm
      isOya={oya}
      isTsumo={question.isTsumo}
      han={question.answer.han}
      key={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      translationNamespace="chiitoitsuExamChallenge"
      scoreRange="nonMangan"
    />
  );
}
