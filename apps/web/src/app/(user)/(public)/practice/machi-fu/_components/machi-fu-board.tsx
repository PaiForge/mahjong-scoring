"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateMachiFuQuestion } from "@mahjong-scoring/core";
import type { MachiFuQuestion } from "@mahjong-scoring/core";
import { FuChoiceGrid } from "../../_components/fu-choice-grid";
import { useFuChoiceBoard } from "../../_hooks/use-fu-choice-board";
import { MACHI_FU_OPTIONS } from "../_lib/fu-options";
import { MachiFuPrompt } from "./machi-fu-prompt";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { toQuestionResult } from "../_lib/types";
import type { MachiFuQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

type MachiFuBoardProps = RecordingPracticeBoardProps<MachiFuQuestionResult>;

/**
 * 待ち符の出題盤面（待ち牌・和了牌の提示と2択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function MachiFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
}: MachiFuBoardProps) {
  const t = useTranslations("machiFu");
  const recordResult = useCallback(
    (question: MachiFuQuestion, fu: number) =>
      onRecordResult?.(toQuestionResult(question, fu)),
    [onRecordResult],
  );
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion: generateMachiFuQuestion,
    options: MACHI_FU_OPTIONS,
    showFeedback,
    onAnswer,
    onRecordResult: recordResult,
  });

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  return (
    <div className="mt-6 space-y-5">
      {/* Machi tiles */}
      <MachiFuPrompt tiles={question.tiles} agariHai={question.agariHai} />

      {/* Question */}
      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

      {/* Fu options */}
      <FuChoiceGrid
        options={MACHI_FU_OPTIONS}
        answer={question.answer}
        selectedFu={selectedFu}
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onSelect={handleSelect}
        columnsClassName="grid-cols-2"
        translationNamespace="machiFu"
      />
    </div>
  );
}
