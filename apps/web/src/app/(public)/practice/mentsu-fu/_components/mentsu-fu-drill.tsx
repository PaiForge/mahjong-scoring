"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { generateMentsuFuQuestion } from "@mahjong-scoring/core";
import type { MentsuFuQuestion } from "@mahjong-scoring/core";
import { Furo } from "@pai-forge/mahjong-react-ui";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { DrillShell } from "../../_components/drill-shell";
import { getFeedbackStyles } from "../../_lib/feedback-styles";
import { FU_OPTIONS } from "../../_lib/fu-options";

export function MentsuFuDrill() {
  const t = useTranslations("mentsuFu");
  const [question, setQuestion] = useState<MentsuFuQuestion>(
    generateMentsuFuQuestion
  );
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const session = useTimedSession();

  const advanceQuestion = useCallback(() => {
    setQuestion(generateMentsuFuQuestion());
    setSelectedFu(undefined);
  }, []);

  const handleFuClick = useCallback(
    (fu: number) => {
      if (session.showFeedback) return;
      setSelectedFu(fu);
      session.handleAnswer(fu === question.answer, advanceQuestion);
    },
    [session, question.answer, advanceQuestion]
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
    <DrillShell session={session} resultPath="/practice/mentsu-fu/result">
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
        {FU_OPTIONS.map((fu) => {
          const { borderClass, bgClass } = getFeedbackStyles(
            session.showFeedback,
            selectedFu === fu,
            question.answer === fu,
          );

          return (
            <button
              key={fu}
              type="button"
              disabled={session.showFeedback || session.isCountingDown}
              onClick={() => handleFuClick(fu)}
              className={`flex items-center justify-center rounded-xl border ${borderClass} ${bgClass} p-4 text-2xl font-bold transition-all`}
            >
              {t("fuOption", { value: fu })}
            </button>
          );
        })}
      </div>
    </DrillShell>
  );
}
