"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { generateMachiFuQuestion } from "@mahjong-scoring/core";
import type { MachiFuQuestion } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { useTimedSession } from "../../_hooks/use-timed-session";
import type { FinishCallbackArgs } from "../../_hooks/use-finish-redirect";
import { ChoiceButton } from "../../_components/choice-button";
import { DrillShell } from "../../_components/drill-shell";
import { getFeedbackStyles } from "../../_lib/feedback-styles";
import { savePracticeResult } from "../../_actions/save-practice-result";

const FU_OPTIONS = [0, 2] as const;

export function MachiFuDrill() {
  const t = useTranslations("machiFu");
  const [question, setQuestion] = useState<MachiFuQuestion>(
    generateMachiFuQuestion
  );
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, handleAnswer } = gameSession;

  const advanceQuestion = useCallback(() => {
    setQuestion(generateMachiFuQuestion());
    setSelectedFu(undefined);
  }, []);

  const handleFinish = useCallback(async (args: FinishCallbackArgs) => {
    if (args.totalCount === 0) return;
    const result = await savePracticeResult('machi_fu', 'default', {
      score: args.correctCount,
      incorrectAnswers: args.incorrectCount,
      timeTaken: Math.round(args.elapsedMs / 1000),
    });
    if (!result.success) {
      console.error("[savePracticeResult] machi_fu:", result.error);
    }
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

  return (
    <DrillShell gameSession={gameSession} timerControl={timerControl} resultPath="/practice/machi-fu/result" onFinish={handleFinish}>
      {/* Machi tiles */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-surface-400">
            {t("machiLabel")}
          </span>
          <div className="flex gap-0.5 scale-125 origin-center">
            {question.tiles.map((tile, i) => (
              <Hai key={i} hai={tile} />
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-surface-100" />

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-surface-400">
            {t("agariLabel")}
          </span>
          <div className="scale-125 origin-center">
            <Hai hai={question.agariHai} />
          </div>
        </div>
      </div>

      {/* Question */}
      <p className="mt-6 text-center text-sm font-medium text-surface-600">
        {t("questionPrompt")}
      </p>

      {/* Fu options */}
      <div className="mt-4 grid grid-cols-2 gap-3">
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
