"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateMentsuFuQuestion } from "@mahjong-scoring/core";
import type { MentsuFuQuestion } from "@mahjong-scoring/core";
import { Furo } from "@pai-forge/mahjong-react-ui";
import { FuChoiceGrid } from "../../_components/fu-choice-grid";
import { PromptLabel } from "../../_components/prompt-label";
import { useFuChoiceBoard } from "../../_hooks/use-fu-choice-board";
import { FU_OPTIONS } from "../../_lib/fu-options";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { toQuestionResult } from "../_lib/types";
import type { MentsuFuQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

type MentsuFuBoardProps = RecordingPracticeBoardProps<MentsuFuQuestionResult>;

/**
 * 面子符の出題盤面（面子の提示と符の選択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function MentsuFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
}: MentsuFuBoardProps) {
  const t = useTranslations("mentsuFu");
  const recordResult = useCallback(
    (question: MentsuFuQuestion, fu: number) =>
      onRecordResult?.(toQuestionResult(question, fu)),
    [onRecordResult],
  );
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion: generateMentsuFuQuestion,
    options: FU_OPTIONS,
    showFeedback,
    onAnswer,
    onRecordResult: recordResult,
  });

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="mentsuFu"
      />
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {/* Mentsu display */}
      <div className="flex flex-col items-center gap-4">
        <PromptLabel>{t("mentsuLabel")}</PromptLabel>
        <div className="flex items-center justify-center min-h-16">
          <div className="scale-150 origin-center">
            <Furo mentsu={question.mentsu} furo={question.mentsu.furo} />
          </div>
        </div>
      </div>

      {/* Question */}
      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

      {/* Fu options */}
      <FuChoiceGrid
        options={FU_OPTIONS}
        answer={question.answer}
        selectedFu={selectedFu}
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onSelect={handleSelect}
        columnsClassName="grid-cols-3"
        translationNamespace="mentsuFu"
      />
    </div>
  );
}
