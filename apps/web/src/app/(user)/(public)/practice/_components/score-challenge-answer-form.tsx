"use client";

import { allowsDoubleYakuman, isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import type { ScoreOptionRange } from "../score/_lib/get-available-scores";
import { ScoreAnswerForm } from "./score-answer-form";

interface ScoreChallengeAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /** 正誤フィードバック表示中か（セッションから受け取る） */
  readonly showFeedback?: boolean;
  /** 直前の回答が正解だったか（未回答・無回答の正解開示中は undefined） */
  readonly lastAnswerCorrect?: boolean;
  /** i18n の翻訳ネームスペース（例: "scoreCalculationChallenge"） */
  readonly translationNamespace: string;
  /** 選択肢を絞る点数帯。出題条件と揃える。省略時は絞らない */
  readonly scoreRange?: ScoreOptionRange;
}

/**
 * 点数計算チャレンジ共通の回答フォーム
 * 点数計算チャレンジ回答フォーム
 *
 * 点数のみを select で回答する。親子・ツモロンの別は出題（`question`）から
 * 導くので、呼び出し側は渡さない。
 *
 * 選択肢にはダブル役満の点数（子64000点等）を端末のルール設定に従って足す。
 * 昇級試験の回答フォーム（exam/_components/score-exam-answer-form.tsx）は
 * 見た目が同じでもここを共有しない。試験は全受験者を同じ土俵で比べるため
 * 選択肢が端末設定で変わってはならず、ルール設定を読まないことがあちらの
 * 仕様だからで、統合すると片方の前提が崩れる。
 */
export function ScoreChallengeAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
  showFeedback = false,
  lastAnswerCorrect,
  translationNamespace,
  scoreRange,
}: ScoreChallengeAnswerFormProps) {
  // ダブル役満採用時のみ、その点数（子64000点等）を選択肢に足す
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());

  return (
    <ScoreAnswerForm
      isOya={isOya(question.jikaze)}
      isTsumo={question.isTsumo}
      han={question.answer.han}
      key={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      translationNamespace={translationNamespace}
      scoreRange={scoreRange}
      allowDoubleYakuman={allowDoubleYakuman}
    />
  );
}
