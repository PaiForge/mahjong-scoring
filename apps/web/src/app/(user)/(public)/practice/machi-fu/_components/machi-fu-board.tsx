"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { generateMachiFuQuestion } from "@mahjong-scoring/core";
import type { MachiFuQuestion } from "@mahjong-scoring/core";
import { ChoiceButton } from "../../_components/choice-button";
import { getChoiceFeedbackProps } from "../../_lib/feedback-styles";
import { MACHI_FU_OPTIONS } from "../_lib/fu-options";
import { MachiFuPrompt } from "./machi-fu-prompt";

interface MachiFuBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
}

/**
 * 待ち符の出題盤面（待ち牌・和了牌の提示と2択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function MachiFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
}: MachiFuBoardProps) {
  const t = useTranslations("machiFu");
  const [question, setQuestion] = useState<MachiFuQuestion>(
    generateMachiFuQuestion,
  );
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateMachiFuQuestion());
    setSelectedFu(undefined);
  }, []);

  const handleFuSelect = useCallback(
    (index: number) => {
      if (showFeedback) return;
      const fu = MACHI_FU_OPTIONS[index];
      setSelectedFu(fu);
      onAnswer(fu === question.answer, advanceQuestion);
    },
    [showFeedback, onAnswer, question.answer, advanceQuestion],
  );

  return (
    <div className="mt-6 space-y-5">
      {/* Machi tiles */}
      <MachiFuPrompt tiles={question.tiles} agariHai={question.agariHai} />

      {/* Question */}
      <p className="text-center text-sm font-medium text-surface-600">
        {t("questionPrompt")}
      </p>

      {/* Fu options */}
      <div className="grid grid-cols-2 gap-3">
        {MACHI_FU_OPTIONS.map((fu, i) => (
          <ChoiceButton
            key={fu}
            index={i}
            onSelect={handleFuSelect}
            className="text-2xl font-bold"
            {...getChoiceFeedbackProps({
              showFeedback,
              isCountingDown,
              isSelected: selectedFu === fu,
              isCorrect: question.answer === fu,
            })}
          >
            {t("fuOption", { value: fu })}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
