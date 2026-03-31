"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateTehaiFuQuestion } from "@mahjong-scoring/core";
import type { TehaiFuQuestion } from "@mahjong-scoring/core";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { DrillShell } from "../../_components/drill-shell";
import { retryGenerate } from "../../_lib/retry-generate";
import { TehaiDisplay } from "./tehai-display";
import { FuItemRow } from "./fu-item-row";

function generateQuestion(): TehaiFuQuestion | undefined {
  return retryGenerate(generateTehaiFuQuestion);
}

export function TehaiFuDrill() {
  const t = useTranslations("tehaiFu");
  const [question, setQuestion] = useState<TehaiFuQuestion | undefined>(generateQuestion);
  const [answers, setAnswers] = useState<string[]>(() =>
    new Array(5).fill("")
  );
  const [tileScale, setTileScale] = useState(1);

  const { gameSession, timerControl } = useTimedSession();
  const { showFeedback, isCountingDown, handleAnswer } = gameSession;

  const advanceQuestion = useCallback(() => {
    const q = generateQuestion();
    setQuestion(q);
    setAnswers(q ? new Array(q.items.length).fill("") : []);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!question || showFeedback) return;
    const allCorrect = question.items.every(
      (item, idx) => parseInt(answers[idx]) === item.fu,
    );
    handleAnswer(allCorrect, advanceQuestion);
  }, [question, answers, showFeedback, handleAnswer, advanceQuestion]);

  const handleSelect = useCallback(
    (idx: number, value: string) => {
      if (showFeedback) return;
      setAnswers((prev) => {
        const next = [...prev];
        next[idx] = value;
        return next;
      });
    },
    [showFeedback],
  );

  if (!question) return undefined;

  const allAnswered = answers.length > 0 && answers.every((a) => a !== "");

  return (
    <DrillShell gameSession={gameSession} timerControl={timerControl} resultPath="/practice/tehai-fu/result" maxWidth="max-w-lg">
      <TehaiDisplay question={question} onScaleChange={setTileScale} />

      {/* Item list */}
      <div className="mt-4 space-y-2">
        {question.items.map((item, idx) => (
          <FuItemRow
            key={item.id}
            index={idx}
            item={item}
            answer={answers[idx]}
            showFeedback={showFeedback}
            isCountingDown={isCountingDown}
            onSelect={handleSelect}
            tileScale={tileScale}
          />
        ))}
      </div>

      {/* Submit button */}
      <div className="mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || showFeedback || isCountingDown}
          className={`w-full rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
            allAnswered && !showFeedback && !isCountingDown
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
