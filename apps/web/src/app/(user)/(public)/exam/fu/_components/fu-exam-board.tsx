"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  FU_VALUES,
  generateTotalFuQuestion,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { TotalFuQuestion } from "@mahjong-scoring/core";
import { FuBreakdown } from "@/app/(user)/(public)/practice/_components/fu-breakdown";
import { FuChoiceGrid } from "@/app/(user)/(public)/practice/_components/fu-choice-grid";
import { QuestionGeneratingPlaceholder } from "@/app/(user)/(public)/practice/_components/question-generating-placeholder";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { TehaiDisplay } from "@/app/(user)/(public)/practice/_components/tehai-display";
import { useFuChoiceBoard } from "@/app/(user)/(public)/practice/_hooks/use-fu-choice-board";
import { useTrainingMode } from "@/app/(user)/(public)/practice/_hooks/use-training-mode";
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
 * `TotalFuBoard` と同じ構図だが、本番の試験では符の内訳を一切出さない（内訳は
 * 回答の答え合わせそのもので、試験中に見せる情報ではない）。振り返りは結果
 * ページの問題別フィードバック一覧で行う。
 *
 * 同じ盤面を模試（`/exam/fu/training`。時間無制限・記録なしのトレーニング）
 * でも描く。模試では回答後の停止中と「わからない」の開示中に内訳を出す
 * （合計符の練習のトレーニングと同じ答え合わせ）。出題条件は本番と同じ。
 *
 * ルール設定ストア（連風牌4符）を意図的に読まない: 出題は
 * `EXAM_GENERATE_OPTIONS` が場風＝自風の局面を除いており、設定は符に影響
 * しないため、端末設定に関係なく全受験者が同一条件になる。
 */
export function FuExamBoard({
  showFeedback,
  isCountingDown = false,
  isTraining = false,
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
  // 内訳は模試で止まっている間だけ出す（開示・回答後のどちらでも）。
  // 本番の試験ではどちらも立たない
  const { isRevealed, isHolding } = useTrainingMode();

  if (!question) {
    // 選択肢が 11 個並ぶぶん他の試験より高い（`loading.tsx` と同じ tall）
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="fuExam"
      />
    );
  }

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
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

      {(isRevealed || isHolding) && (
        <FuBreakdown
          details={question.fuDetails}
          answer={question.answer}
          translationNamespace="fuExamChallenge"
        />
      )}
    </div>
  );
}
