"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { generateMentsuFuQuestion } from "@mahjong-scoring/core";
import type { MentsuFuQuestion } from "@mahjong-scoring/core";
import { Furo } from "@pai-forge/mahjong-react-ui";
import { ChoiceButton } from "../../_components/choice-button";
import { getFeedbackStyles } from "../../_lib/feedback-styles";
import { FU_OPTIONS } from "../../_lib/fu-options";

interface MentsuFuBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
}

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
  const [question, setQuestion] = useState<MentsuFuQuestion>(
    generateMentsuFuQuestion
  );
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateMentsuFuQuestion());
    setSelectedFu(undefined);
  }, []);

  const handleFuSelect = useCallback(
    (index: number) => {
      if (showFeedback) return;
      const fu = FU_OPTIONS[index];
      setSelectedFu(fu);
      onAnswer(fu === question.answer, advanceQuestion);
    },
    [showFeedback, onAnswer, question.answer, advanceQuestion]
  );

  return (
    <>
      {/* Mentsu display */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <span className="text-sm font-bold uppercase tracking-widest text-surface-400">
          {t("mentsuLabel")}
        </span>
        <div className="flex items-center justify-center min-h-16">
          <div className="scale-150 origin-center">
            <Furo mentsu={question.mentsu} furo={question.mentsu.furo} />
          </div>
        </div>
      </div>

      {/* Question */}
      <p className="mt-6 text-center text-sm font-medium text-surface-600">
        {t("questionPrompt")}
      </p>

      {/* Fu options */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {FU_OPTIONS.map((fu, i) => {
          const { borderClass, bgClass } = getFeedbackStyles(
            showFeedback,
            selectedFu === fu,
            question.answer === fu,
          );

          return (
            <ChoiceButton
              key={fu}
              index={i}
              onSelect={handleFuSelect}
              disabled={showFeedback || isCountingDown}
              borderClass={borderClass}
              bgClass={bgClass}
              className="text-2xl font-bold"
            >
              {t("fuOption", { value: fu })}
            </ChoiceButton>
          );
        })}
      </div>
    </>
  );
}
