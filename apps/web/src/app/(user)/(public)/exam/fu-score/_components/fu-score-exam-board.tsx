"use client";

import { useTranslations } from "next-intl";
import { QuestionGeneratingPlaceholder } from "@/app/(user)/(public)/practice/_components/question-generating-placeholder";
import { useScoreQuestionBoard } from "@/app/(user)/(public)/practice/_hooks/use-score-question-board";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/score/_components/question-display";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { ScoreExamAnswerForm } from "../../_components/score-exam-answer-form";
import type { FuScoreExamQuestionResult } from "../_lib/types";
import { EXAM_GENERATE_OPTIONS } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "@/app/(user)/(public)/practice/_lib/practice-board-props";

type FuScoreExamBoardProps =
  RecordingPracticeBoardProps<FuScoreExamQuestionResult>;

/**
 * 昇級試験（30〜50符の点数計算）の出題盤面（手牌の提示と点数の回答）
 * 昇級試験盤面
 *
 * `PinfuExamBoard` と同じ構図で、違うのは出題条件だけ。役一覧は表示しない —
 * 受験者が手牌から符と翻数を自力で出すのが試験の要件で、この級では符も
 * 役で固定されない。
 *
 * 回答は点数のみを select で選ぶ。符も役も表示されないため、手牌から符を
 * 積み上げ、翻数を数え、点数表を引くところまでを受験者が通しで行う。
 * 選択肢は満貫未満（`nonMangan`）に固定する。
 *
 * ルール設定ストア（連風牌4符・切り上げ満貫）を意図的に読まない
 * （`EXAM_GENERATE_OPTIONS` 参照）。
 */
export function FuScoreExamBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
}: FuScoreExamBoardProps) {
  const t = useTranslations("fuScoreExamChallenge");

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

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

      {/* Answer form */}
      <ScoreExamAnswerForm
        question={question}
        questionIndex={questionIndex}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
        translationNamespace="fuScoreExamChallenge"
        scoreRange="nonMangan"
      />
    </div>
  );
}
