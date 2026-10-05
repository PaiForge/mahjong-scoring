"use client";

import { useTranslations } from "next-intl";
import { generateMachiFuQuestion } from "@mahjong-scoring/core";
import { FuChoiceGrid } from "../../_components/fu-choice-grid";
import { useFuChoiceBoard } from "@mahjong-scoring/features/practice/use-fu-choice-board";
import { MACHI_FU_OPTIONS } from "@mahjong-scoring/features/practice/machi-fu/fu-options";
import { MachiFuPrompt } from "./machi-fu-prompt";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { toQuestionResult } from "@mahjong-scoring/features/practice/machi-fu/types";
import type { MachiFuQuestionResult } from "@mahjong-scoring/features/practice/machi-fu/types";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";

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
  onPresentQuestion,
}: MachiFuBoardProps) {
  const t = useTranslations("machiFu");
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion: generateMachiFuQuestion,
    options: MACHI_FU_OPTIONS,
    toResult: toQuestionResult,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="machiFu"
      />
    );
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
