"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  FU_VALUES,
  generateTotalFuQuestion,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { TotalFuQuestion } from "@mahjong-scoring/core";
import { FuChoiceGrid } from "@/app/(user)/(public)/practice/_components/fu-choice-grid";
import { QuestionGeneratingPlaceholder } from "@/app/(user)/(public)/practice/_components/question-generating-placeholder";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { TehaiDisplay } from "@/app/(user)/(public)/practice/_components/tehai-display";
import { useFuChoiceBoard } from "@/app/(user)/(public)/practice/_hooks/use-fu-choice-board";
import type { RecordingPracticeBoardProps } from "@/app/(user)/(public)/practice/_lib/practice-board-props";
import {
  EXAM_GENERATE_OPTIONS,
  EXAM_GENERATION_MAX_RETRIES,
  toFuQuestionResult,
} from "../_lib/types";
import type { FuExamQuestionResult } from "../_lib/types";

type FuExamBoardProps = RecordingPracticeBoardProps<FuExamQuestionResult>;

/**
 * 昇級試験（手牌の合計符）の出題盤面（手牌の提示と符の選択）
 * 昇級試験盤面
 *
 * `TotalFuBoard` と同じ構図だが、符の内訳を一切出さない（内訳は回答の答え合わせ
 * そのもので、試験中に見せる情報ではない）。振り返りは結果ページの問題別
 * フィードバック一覧で行う。
 *
 * ルール設定ストア（連風牌4符）を意図的に読まない: 出題は
 * `EXAM_GENERATE_OPTIONS` が場風＝自風の局面を除いており、設定は符に影響
 * しないため、端末設定に関係なく全受験者が同一条件になる。
 */
export function FuExamBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
}: FuExamBoardProps) {
  const t = useTranslations("fuExamChallenge");
  const generateQuestion = useCallback(
    () =>
      retryGenerate(
        () => generateTotalFuQuestion(EXAM_GENERATE_OPTIONS),
        EXAM_GENERATION_MAX_RETRIES,
      ),
    [],
  );
  const recordResult = useCallback(
    (question: TotalFuQuestion, fu: number) =>
      onRecordResult?.(toFuQuestionResult(question, fu)),
    [onRecordResult],
  );
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion,
    options: FU_VALUES,
    showFeedback,
    onAnswer,
    onRecordResult: recordResult,
  });

  if (!question) {
    // 選択肢が 11 個並ぶぶん他の試験より高い（`loading.tsx` と同じ tall）
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="tall"
      />
    );
  }

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        mobileFrame="fullBleed"
      />

      <QuestionPrompt>{t("prompt")}</QuestionPrompt>

      <FuChoiceGrid
        options={FU_VALUES}
        answer={question.answer}
        selectedFu={selectedFu}
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onSelect={handleSelect}
        columnsClassName="grid-cols-3"
        translationNamespace="fuExamChallenge"
      />
    </div>
  );
}
