"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { generateMentsuFuQuestion } from "@mahjong-scoring/core";
import type { MentsuFuQuestion } from "@mahjong-scoring/core";
import { Furo } from "@pai-forge/mahjong-react-ui";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { ChoiceButton } from "../../_components/choice-button";
import { DrillShell } from "../../_components/drill-shell";
import { getFeedbackStyles } from "../../_lib/feedback-styles";
import { FU_OPTIONS } from "../../_lib/fu-options";

export function MentsuFuDrill() {
  const t = useTranslations("mentsuFu");
  const [question, setQuestion] = useState<MentsuFuQuestion>(
    generateMentsuFuQuestion
  );
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, handleAnswer } = gameSession;

  const advanceQuestion = useCallback(() => {
    setQuestion(generateMentsuFuQuestion());
    setSelectedFu(undefined);
  }, []);

  const handleFuSelect = useCallback(
    (index: number) => {
      if (showFeedback) return;
      const fu = FU_OPTIONS[index];
      setSelectedFu(fu);
      handleAnswer(fu === question.answer, advanceQuestion);
    },
    [showFeedback, handleAnswer, question.answer, advanceQuestion]
  );

  const renderMentsu = () => {
    const { mentsu } = question;
    return (
      <div className="scale-150 origin-center">
        <Furo mentsu={mentsu} furo={mentsu.furo} />
      </div>
    );
  };

  return (
    <DrillShell gameSession={gameSession} timerControl={timerControl} resultPath="/practice/mentsu-fu/result">
      {/* Mentsu display */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <span className="text-sm font-bold uppercase tracking-widest text-surface-400">
          {t("mentsuLabel")}
        </span>
        <div className="flex items-center justify-center min-h-16">
          {renderMentsu()}
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
    </DrillShell>
  );
}
