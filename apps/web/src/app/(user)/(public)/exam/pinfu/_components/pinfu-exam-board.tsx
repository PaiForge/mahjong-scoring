"use client";

import { useTranslations } from "next-intl";
import { QuestionGeneratingPlaceholder } from "@/app/(user)/(public)/practice/_components/question-generating-placeholder";
import { useScoreQuestionBoard } from "@/app/(user)/(public)/practice/_hooks/use-score-question-board";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/score/_components/question-display";
import { PinfuExamAnswerForm } from "./pinfu-exam-answer-form";
import type { PinfuExamQuestionResult } from "../_lib/types";
import {
  EXAM_GENERATE_OPTIONS,
  EXAM_GENERATION_MAX_RETRIES,
} from "../_lib/types";
import type { RecordingPracticeBoardProps } from "@/app/(user)/(public)/practice/_lib/practice-board-props";

type PinfuExamBoardProps = RecordingPracticeBoardProps<PinfuExamQuestionResult>;

/**
 * 昇級試験（平和の点数計算）の出題盤面（手牌の提示と点数の回答）
 * 昇級試験盤面
 *
 * `ChiitoitsuExamBoard` と同じ構図で、違うのは出題条件だけ。役一覧は
 * 表示しない — 受験者が手牌から翻数を自力で数えるのが試験の要件で、
 * 平和が成立していること自体が最初の1翻ぶんの判断にあたる。
 *
 * ルール設定ストア（連風牌4符・切り上げ満貫）を意図的に読まない
 * （`EXAM_GENERATE_OPTIONS` 参照）。
 */
export function PinfuExamBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
}: PinfuExamBoardProps) {
  const t = useTranslations("pinfuExamChallenge");

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
    <div className="space-y-6">
      {/* Question display */}
      <QuestionDisplay question={question} mobileFrame="fullBleed" />

      {/* Answer form */}
      <PinfuExamAnswerForm
        question={question}
        questionIndex={questionIndex}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
