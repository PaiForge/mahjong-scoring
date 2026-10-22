import { allowsDoubleYakuman } from "@mahjong-scoring/core";
import {
  type ScoreChallengeAnswerFormProps,
  scoreAnswerTargetOf,
} from "@mahjong-scoring/features/practice/score/score-answer-form-props";

import { useYakumanRules } from "../../hooks/use-rule-settings-store";
import { ScoreAnswerForm } from "./score-answer-form";

/**
 * 点数計算チャレンジ共通の回答フォーム
 * 点数計算チャレンジ回答フォーム
 *
 * web の `ScoreChallengeAnswerForm` の移植。点数のみを選択欄で回答し、
 * 親子・ツモロンの別は出題から導く。選択が揃った時点で送信する。
 *
 * トレーニングでは、選択肢にダブル役満の点数（子64000点等）を端末のルール
 * 設定に従って足す。チャレンジでは選択肢を設定に依らない集合に固定する
 * （`fixedRules`。理由は features の `challenge/rule-boundary.ts`）。
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
      {...scoreAnswerTargetOf(question)}
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
