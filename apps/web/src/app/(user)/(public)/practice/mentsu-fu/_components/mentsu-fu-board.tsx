"use client";

import { useTranslations } from "next-intl";
import { generateMentsuFuQuestion } from "@mahjong-scoring/core";
import { Furo } from "@pai-forge/mahjong-react-ui";
import { FuChoiceGrid } from "../../_components/fu-choice-grid";
import { PromptLabel } from "../../_components/prompt-label";
import { useFuChoiceBoard } from "../../_hooks/use-fu-choice-board";
import { FU_OPTIONS } from "../../_lib/fu-options";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import type { PracticeBoardProps } from "../../_lib/practice-board-props";

type MentsuFuBoardProps = PracticeBoardProps;

/**
 * 面子符の出題盤面（面子の提示と符の選択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function MentsuFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
}: MentsuFuBoardProps) {
  const t = useTranslations("mentsuFu");
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion: generateMentsuFuQuestion,
    options: FU_OPTIONS,
    showFeedback,
    onAnswer,
  });

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
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
