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
import { DrillShell } from "../../_components/drill-shell";
import { getFeedbackStyles } from "../../_lib/feedback-styles";

export function JantouFuDrill() {
  const t = useTranslations("jantouFu");
  const [question, setQuestion] = useState<JantouFuQuestion>(
    generateJantouFuQuestion
  );
  const [selectedHai, setSelectedHai] = useState<JantouFuChoice["hai"] | undefined>(undefined);

  const session = useTimedSession();

  const advanceQuestion = useCallback(() => {
    setQuestion(generateJantouFuQuestion());
    setSelectedHai(undefined);
  }, []);

  const handleChoiceClick = useCallback(
    (choice: JantouFuChoice) => {
      if (session.showFeedback) return;
      setSelectedHai(choice.hai);
      session.handleAnswer(choice.isCorrect, advanceQuestion);
    },
    [session, advanceQuestion]
  );

  return (
    <DrillShell session={session} resultPath="/practice/jantou-fu/result">
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
        {question.choices.map((choice) => {
          const { borderClass, bgClass } = getFeedbackStyles(
            session.showFeedback,
            selectedHai === choice.hai,
            choice.isCorrect,
          );

          return (
            <button
              key={`${question.id}-${choice.hai}`}
              type="button"
              disabled={session.showFeedback || session.isCountingDown}
              onClick={() => handleChoiceClick(choice)}
              className={`flex flex-col items-center gap-5 rounded-xl border ${borderClass} ${bgClass} p-4 transition-all`}
            >
              <div className="scale-125">
                <Hai hai={choice.hai} />
              </div>
            </button>
          );
        })}
      </div>
    </DrillShell>
  );
}
