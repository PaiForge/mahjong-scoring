"use client";

import { isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "@/app/(user)/(public)/practice/_components/score-answer-form";

interface FuScoreExamAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
}

/**
 * 昇級試験（30〜50符の点数計算）の回答フォーム
 * 昇級試験回答フォーム
 *
 * 点数のみを select で回答する。役も符も表示されないため、手牌から符を
 * 積み上げ、翻数を数え、点数表を引くところまでを受験者が通しで行う。
 * 選択肢は `scoreRange` で満貫未満に固定する — 翻数から絞ると選択肢の個数が
 * 翻数のヒントになり、さらに 30符4翻 は切り上げ満貫が効くセルなので、
 * 端末設定で選択肢が受験者ごとに変わってしまう。
 */
export function FuScoreExamAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
}: FuScoreExamAnswerFormProps) {
  const oya = isOya(question.jikaze);

  return (
    <ScoreAnswerForm
      isOya={oya}
      isTsumo={question.isTsumo}
      han={question.answer.han}
      key={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      translationNamespace="fuScoreExamChallenge"
      scoreRange="nonMangan"
    />
  );
}
