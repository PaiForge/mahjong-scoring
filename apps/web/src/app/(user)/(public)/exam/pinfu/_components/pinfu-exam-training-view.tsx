"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createTrainingView } from "@/app/(user)/(public)/practice/_lib/create-challenge-views";
import { PinfuExamBoard } from "./pinfu-exam-board";

/**
 * 昇級試験（平和の点数計算）の模試
 * 昇級試験模試
 *
 * 本番と同じ盤面（出題条件・回答形式）を時間無制限・記録なしで解く。
 * 回答後は正解を読ませてから次へ進む。模試の仕組み（見出し・終了・本番への
 * 導線）は `createTrainingView` が試験のスラッグから組む。
 */
export const PinfuExamTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.pinfuExam,
  maxWidth: "max-w-lg",
  hasSubmitButton: true,
  renderBoard: ({ showFeedback, lastAnswerCorrect, isTraining, onAnswer }) => (
    <PinfuExamBoard
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      isTraining={isTraining}
      onAnswer={onAnswer}
    />
  ),
});
