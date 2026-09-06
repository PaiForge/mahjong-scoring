"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createTrainingView } from "@/app/(user)/(public)/practice/_lib/create-challenge-views";
import { FuExamBoard } from "./fu-exam-board";

/**
 * 昇級試験（手牌の合計符）の模試
 * 昇級試験模試
 *
 * 本番と同じ盤面（出題条件・回答形式）を時間無制限・記録なしで解く。
 * 回答後は正解を読ませてから次へ進む。模試の仕組み（見出し・終了・本番への
 * 導線）は `createTrainingView` が試験のスラッグから組む。
 */
export const FuExamTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.fuExam,
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, isTraining, onAnswer }) => (
    <FuExamBoard
      showFeedback={showFeedback}
      isTraining={isTraining}
      onAnswer={onAnswer}
    />
  ),
});
