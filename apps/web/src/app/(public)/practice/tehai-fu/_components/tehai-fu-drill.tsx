"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateTehaiFuQuestion } from "@mahjong-scoring/core";
import type { TehaiFuQuestion } from "@mahjong-scoring/core";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { DrillShell } from "../../_components/drill-shell";
import { TehaiDisplay } from "./tehai-display";
import { FuItemRow } from "./fu-item-row";

function generateQuestion(): TehaiFuQuestion | undefined {
  for (let i = 0; i < 10; i++) {
    const q = generateTehaiFuQuestion();
    if (q) return q;
  }
  return undefined;
}

export function TehaiFuDrill() {
  const t = useTranslations("tehaiFu");
  const [question, setQuestion] = useState<TehaiFuQuestion | undefined>(generateQuestion);
  const [answers, setAnswers] = useState<string[]>(() =>
    new Array(5).fill("")
  );

  const session = useTimedSession();

  const advanceQuestion = useCallback(() => {
    const q = generateQuestion();
    setQuestion(q);
    setAnswers(q ? new Array(q.items.length).fill("") : []);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!question || session.showFeedback) return;
    const allCorrect = question.items.every(
      (item, idx) => parseInt(answers[idx]) === item.fu,
    );
    session.handleAnswer(allCorrect, advanceQuestion);
  }, [question, answers, session, advanceQuestion]);

  const handleSelect = useCallback(
    (idx: number, value: string) => {
      if (session.showFeedback) return;
      setAnswers((prev) => {
        const next = [...prev];
        next[idx] = value;
        return next;
      });
    },
    [session.showFeedback],
  );

  if (!question) return undefined;

  const allAnswered = answers.length > 0 && answers.every((a) => a !== "");

  return (
    <DrillShell session={session} resultPath="/practice/tehai-fu/result" maxWidth="max-w-lg">
      <TehaiDisplay question={question} />

      {/* Item list */}
      <div className="mt-4 space-y-2">
        {question.items.map((item, idx) => (
          <FuItemRow
            key={item.id}
            item={item}
            answer={answers[idx]}
            showFeedback={session.showFeedback}
            isCountingDown={session.isCountingDown}
            onSelect={(value) => handleSelect(idx, value)}
          />
        ))}
      </div>

      {/* Submit button */}
      <div className="mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || session.showFeedback || session.isCountingDown}
          className={`w-full rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
            allAnswered && !session.showFeedback && !session.isCountingDown
              ? "bg-primary-500 hover:bg-primary-600"
              : "cursor-not-allowed bg-surface-300"
          }`}
        >
          {t("checkButton")}
        </button>
      </div>
    </DrillShell>
  );
}
