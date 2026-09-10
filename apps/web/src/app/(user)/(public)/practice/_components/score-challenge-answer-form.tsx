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
  /**
   * トレーニングモードか（チャレンジでは未指定）。
   * トレーニングだけが端末のルール設定で選択肢を変える
   */
  readonly isTraining?: boolean;
}

/**
 * 点数計算チャレンジ共通の回答フォーム
 * 点数計算チャレンジ回答フォーム
 *
 * 点数のみを select で回答する。親子・ツモロンの別は出題（`question`）から
 * 導くので、呼び出し側は渡さない。選択が揃った時点で送信し、「回答する」
 * ボタンは置かない（理由は {@link ScoreAnswerForm} の `autoSubmit`）。
 *
 * トレーニングでは、選択肢にダブル役満の点数（子64000点等）を端末のルール
 * 設定に従って足す。チャレンジ（記録あり）では選択肢を設定に依らない集合に
 * 固定する（`fixedRules`。理由は `_lib/rule-boundary.ts`）。
 * 昇級試験の回答フォーム（exam/_components/score-exam-answer-form.tsx）は
 * 見た目が同じでもここを共有しない。試験はルール設定を読まないことが
 * あちらの仕様で、統合すると片方の前提が崩れる。
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
  isTraining = false,
}: ScoreChallengeAnswerFormProps) {
  // トレーニングでダブル役満採用時のみ、その点数（子64000点等）を選択肢に足す
  const yakumanRules = useYakumanRules();
  const allowDoubleYakuman = isTraining && allowsDoubleYakuman(yakumanRules);

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
      autoSubmit
      fixedRules={!isTraining}
    />
  );
}
