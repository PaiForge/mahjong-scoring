"use client";

import { useTranslations } from "next-intl";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { FeedbackFrame } from "../../_components/feedback-frame";
import { useScoreQuestionBoard } from "../../_hooks/use-score-question-board";
import { QuestionDisplay } from "../../score/_components/question-display";
import { ManganExamAnswerForm } from "./mangan-exam-answer-form";
import type { ManganExamQuestionResult } from "../_lib/types";
import {
  EXAM_GENERATE_OPTIONS,
  EXAM_GENERATION_MAX_RETRIES,
} from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

interface ManganExamBoardProps extends RecordingPracticeBoardProps<ManganExamQuestionResult> {
  /** 直前の回答が正解だったか（フィードバック枠の色分けに使用） */
  readonly lastAnswerCorrect?: boolean;
}

/**
 * 昇級試験（満貫以上の点数計算）の出題盤面（手牌の提示と点数の回答）
 * 昇級試験盤面
 *
 * `ManganScoreCalculationBoard` と同じ構図だが、役一覧を表示しない
 * （受験者が手牌から翻数を自力で数えるのが試験の要件）。
 *
 * ルール設定ストア（連風牌4符・切り上げ満貫）を意図的に読まない:
 * 出題は `EXAM_GENERATE_OPTIONS`（5翻以上）に固定されており、どちらの設定も
 * 点数に影響しないため、端末設定に関係なく全受験者が同一条件になる。
 */
export function ManganExamBoard({
  showFeedback,
  isCountingDown = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
}: ManganExamBoardProps) {
  const t = useTranslations("manganExamChallenge");

  const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
    generateOptions: EXAM_GENERATE_OPTIONS,
    maxRetries: EXAM_GENERATION_MAX_RETRIES,
    showFeedback,
    onAnswer,
    onRecordResult,
  });

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Question display */}
      <FeedbackFrame
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
      >
        <QuestionDisplay question={question} />
      </FeedbackFrame>

      {/* Answer form */}
      <ManganExamAnswerForm
        question={question}
        questionIndex={questionIndex}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
