"use client";

import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { EXAM_BOARD_CONFIG } from "@mahjong-scoring/features/exam/fu-score/types";
import { scoreExamQuestionGenerator } from "@mahjong-scoring/features/exam/score-exam-board-config";
import { createTrainingView } from "@/app/[locale]/(user)/(public)/practice/_lib/create-challenge-views";
import { FuScoreExamBoard } from "./fu-score-exam-board";

/**
 * 昇級試験（30〜50符の点数計算）の模試
 * 昇級試験模試
 *
 * 本番と同じ盤面（出題条件・回答形式）を時間無制限・記録なしで解く。
 * 回答後は正解と翻数・符の内訳を読ませてから次へ進む。模試の仕組み（見出し・終了・本番への
 * 導線）は `createTrainingView` が試験のスラッグから組む。
 *
 * 出題は回数制限に通す（1 日の無料枠。和了形の点数計算と同じ出題を無制限に
 * 解ける抜け道にしないため）。問題は盤面と同じ条件でビューの出題ホストが作る。
 */
export const FuScoreExamTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.fuScoreExam,
  maxWidth: "max-w-lg",
  generateQuestion: scoreExamQuestionGenerator(EXAM_BOARD_CONFIG),
  renderBoard: ({ showFeedback, lastAnswerCorrect, isTraining, onAnswer }) => (
    <FuScoreExamBoard
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      isTraining={isTraining}
      onAnswer={onAnswer}
    />
  ),
});
