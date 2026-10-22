import type { ScoreTableAnswerFormProps } from "@mahjong-scoring/features/practice/score/score-answer-form-props";

import { ScoreAnswerForm } from "../../components/score-answer-form";

/**
 * 点数表早引き練習の回答フォーム
 * 点数表回答フォーム
 *
 * web の `ScoreTableAnswerForm` の移植。点数のみを選択欄で回答する。翻・符は
 * 問題文として表示されるため入力不要。チャレンジでは選択肢を端末のルール
 * 設定に依らない集合に固定する（`fixedRules`）。
 *
 * 正誤は選択欄ではなく出題を囲む枠が示す（web と同じく `showFeedback` を
 * 渡さない）。
 */
export function ScoreTableAnswerForm({
  question,
  onSubmit,
  disabled = false,
  isTraining = false,
}: ScoreTableAnswerFormProps) {
  return (
    <ScoreAnswerForm
      isOya={question.isOya}
      isTsumo={question.isTsumo}
      han={question.han}
      key={question.id}
      onSubmit={onSubmit}
      disabled={disabled}
      translationNamespace="scoreTableChallenge"
      autoSubmit
      fixedRules={!isTraining}
    />
  );
}
