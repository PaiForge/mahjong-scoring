"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  generateJantouFuQuestion,
  getKazeName,
} from "@mahjong-scoring/core";
import type { JantouFuQuestion, JantouFuChoice } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { useSaveOnFinish } from "../../_hooks/use-save-on-finish";
import { ChoiceButton } from "../../_components/choice-button";
import { DrillShell } from "../../_components/drill-shell";
import { getFeedbackStyles } from "../../_lib/feedback-styles";

export function JantouFuDrill() {
  const t = useTranslations("jantouFu");
  const [question, setQuestion] = useState<JantouFuQuestion>(
    generateJantouFuQuestion
  );
  const [selectedHai, setSelectedHai] = useState<JantouFuChoice["hai"] | undefined>(undefined);

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, handleAnswer } = gameSession;

  const advanceQuestion = useCallback(() => {
    setQuestion(generateJantouFuQuestion());
    setSelectedHai(undefined);
  }, []);

  const handleFinish = useSaveOnFinish("jantou_fu");

  const handleChoiceSelect = useCallback(
    (index: number) => {
      if (showFeedback) return;
      const choice = question.choices[index];
      setSelectedHai(choice.hai);
      handleAnswer(choice.isCorrect, advanceQuestion);
    },
    [showFeedback, question.choices, handleAnswer, advanceQuestion]
  );

  return (
    <DrillShell gameSession={gameSession} timerControl={timerControl} resultPath="/practice/jantou-fu/result" onFinish={handleFinish}>
      {/* Context */}
      <div className="mt-6 flex justify-center gap-6 text-sm">
        <div className="text-center">
          <span className="text-surface-400">{t("bakaze")}</span>
          <p className="mt-1 text-lg font-bold text-surface-900">
            {getKazeName(question.context.bakaze)}
          </p>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("jikaze")}</span>
          <p className="mt-1 text-lg font-bold text-surface-900">
            {getKazeName(question.context.jikaze)}
          </p>
        </div>
      </div>

      {/* Question */}
      <p className="mt-6 text-center text-sm font-medium text-surface-600">
        {t("selectCorrectHead")}
      </p>

      {/* Choices */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {question.choices.map((choice, i) => {
          const { borderClass, bgClass } = getFeedbackStyles(
            showFeedback,
            selectedHai === choice.hai,
            choice.isCorrect,
          );

          return (
            <ChoiceButton
              key={`${question.id}-${choice.hai}`}
              index={i}
              onSelect={handleChoiceSelect}
              disabled={showFeedback || isCountingDown}
              borderClass={borderClass}
              bgClass={bgClass}
              className="flex-col gap-5"
            >
              <div className="scale-125">
                <Hai hai={choice.hai} />
              </div>
            </ChoiceButton>
          );
        })}
      </div>
    </DrillShell>
  );
}
