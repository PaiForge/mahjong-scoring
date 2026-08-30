"use client";

import { useTranslations } from "next-intl";
import { QuestionGeneratingPlaceholder } from "@/app/(user)/(public)/practice/_components/question-generating-placeholder";
import { useScoreQuestionBoard } from "@/app/(user)/(public)/practice/_hooks/use-score-question-board";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/score/_components/question-display";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { ManganExamAnswerForm } from "./mangan-exam-answer-form";
import type { ManganExamQuestionResult } from "../_lib/types";
import {
  EXAM_GENERATE_OPTIONS,
  EXAM_GENERATION_MAX_RETRIES,
} from "../_lib/types";
import type { RecordingPracticeBoardProps } from "@/app/(user)/(public)/practice/_lib/practice-board-props";

type ManganExamBoardProps =
  RecordingPracticeBoardProps<ManganExamQuestionResult>;

/**
 * 昇級試験（満貫以上の点数計算）の出題盤面（手牌の提示と点数の回答）
 * 昇級試験盤面
 *
 * `ManganScoreCalculationBoard` と同じ構図だが、役一覧を表示しない
 * （受験者が手牌から翻数を自力で数えるのが試験の要件）。
 *
 * 盤面は他のチャレンジ（`FuExamBoard` 等）と同じく、フィードバック枠で
 * 囲まずに単体で置く。ミス1回で終了する試験では正誤はライフ表示が示し、
 * 答え合わせは結果ページの問題別フィードバック一覧で行うため、盤面の外に
 * もう一枚枠を重ねる理由がない（狭い画面では二重枠のぶん手牌も小さくなる）。
 *
 * ルール設定ストア（連風牌4符・切り上げ満貫）を意図的に読まない:
 * 出題は `EXAM_GENERATE_OPTIONS`（5翻以上）に固定されており、どちらの設定も
 * 点数に影響しないため、端末設定に関係なく全受験者が同一条件になる。
 */
export function ManganExamBoard({
  showFeedback,
  isCountingDown = false,
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
    <div className="space-y-6">
      {/* Question display */}
      <QuestionDisplay question={question} mobileFrame="fullBleed" />

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

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
