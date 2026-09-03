"use client";

import { allowsDoubleYakuman, isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import { ScoreAnswerForm } from "../../_components/score-answer-form";

interface ScoreCalculationAnswerFormProps {
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
  showFeedback = false,
  lastAnswerCorrect,
}: ScoreCalculationAnswerFormProps) {
  const oya = isOya(question.jikaze);
  // ダブル役満採用時のみ、その点数（子64000点等）を選択肢に足す
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());

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
      translationNamespace="scoreCalculationChallenge"
      allowDoubleYakuman={allowDoubleYakuman}
    />
  );
}
