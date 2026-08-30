"use client";

import { isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "@/app/(user)/(public)/practice/_components/score-answer-form";

interface PinfuExamAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
}

/**
 * 昇級試験（平和の点数計算）の回答フォーム
 * 昇級試験回答フォーム
 *
 * 点数のみを select で回答する。役は表示されないため、手牌から翻数を
 * 自分で数え、ツモなら20符・ロンなら30符の点数表から点数を導く。
 * 選択肢は `scoreRange` で満貫未満に固定する — 翻数から絞ると選択肢の個数が
 * 翻数のヒントになり、さらに平和ロンの4翻は 30符4翻、つまり切り上げ満貫が
 * 効くセルなので、端末設定で選択肢が受験者ごとに変わってしまう。
 */
export function PinfuExamAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
}: PinfuExamAnswerFormProps) {
  const oya = isOya(question.jikaze);

  return (
    <ScoreAnswerForm
      isOya={oya}
      isTsumo={question.isTsumo}
      han={question.answer.han}
      key={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      translationNamespace="pinfuExamChallenge"
      scoreRange="nonMangan"
    />
  );
}
