"use client";

import { useTranslations } from "next-intl";
import { QuestionGeneratingPlaceholder } from "@/app/(user)/(public)/practice/_components/question-generating-placeholder";
import { useScoreQuestionBoard } from "@/app/(user)/(public)/practice/_hooks/use-score-question-board";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/score/_components/question-display";
import { ChiitoitsuExamAnswerForm } from "./chiitoitsu-exam-answer-form";
import type { ChiitoitsuExamQuestionResult } from "../_lib/types";
import { EXAM_GENERATE_OPTIONS } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "@/app/(user)/(public)/practice/_lib/practice-board-props";

type ChiitoitsuExamBoardProps =
  RecordingPracticeBoardProps<ChiitoitsuExamQuestionResult>;

/**
 * 昇級試験（七対子の点数計算）の出題盤面（手牌の提示と点数の回答）
 * 昇級試験盤面
 *
 * `ManganExamBoard` と同じ構図で、違うのは出題条件（七対子・満貫未満）と
 * 選択肢の点数帯だけ。役一覧は表示しない — 受験者が手牌から翻数を自力で
 * 数えるのが試験の要件で、七対子が成立していること自体が最初の1翻ぶんの
 * 判断にあたる。
 *
 * ルール設定ストア（連風牌4符・切り上げ満貫）を意図的に読まない:
 * 七対子は雀頭を持たず符も常に25符なので、どちらの設定も出題にも点数にも
 * 影響しない（`EXAM_GENERATE_OPTIONS` 参照）。
 */
export function ChiitoitsuExamBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
}: ChiitoitsuExamBoardProps) {
  const t = useTranslations("chiitoitsuExamChallenge");

  const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
    generateOptions: EXAM_GENERATE_OPTIONS,
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
      <ChiitoitsuExamAnswerForm
        question={question}
        questionIndex={questionIndex}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
