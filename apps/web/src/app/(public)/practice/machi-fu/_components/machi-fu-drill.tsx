"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { generateMachiFuQuestion } from "@mahjong-scoring/core";
import type { MachiFuQuestion } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { ContentContainer } from "@/app/_components/content-container";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { QuizTimer } from "../../_components/quiz-timer";
import { CHALLENGE_TIME_LIMIT } from "../../_lib/challenge-constants";

const FU_OPTIONS = [0, 2] as const;

export function MachiFuDrill() {
  const router = useRouter();
  const t = useTranslations("machiFu");
  const tc = useTranslations("challenge");
  const [question, setQuestion] = useState<MachiFuQuestion>(
    generateMachiFuQuestion
  );
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const session = useTimedSession();

  const advanceQuestion = useCallback(() => {
    setQuestion(generateMachiFuQuestion());
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

  useEffect(() => {
    if (!session.isFinished) return;
    const params = new URLSearchParams({
      correct: session.correctCount.toString(),
      total: session.totalCount.toString(),
      time: session.elapsedMs.toString(),
    });
    router.push(`/practice/machi-fu/play/result?${params.toString()}`);
  }, [session.isFinished, session.correctCount, session.totalCount, session.elapsedMs, router]);

  if (session.isFinished) {
    return undefined;
  }

  return (
    <ContentContainer>
      {/* Countdown overlay */}
      {session.isCountingDown && (
        <div className="fixed inset-0 md:left-64 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <span className="text-6xl font-bold text-primary-500 animate-pulse">
            {session.countdownValue}
          </span>
        </div>
      )}

      <div className="mx-auto max-w-md">
        {/* Status bar */}
        <div className="flex items-center justify-between text-sm">
          <QuizTimer
            timeRemaining={session.remainingSeconds}
            progress={session.elapsedMs / 1000 / CHALLENGE_TIME_LIMIT}
          />
          <div className="flex items-center gap-3">
            <span className="text-surface-500">
              {tc("score")}: <span className="font-semibold text-surface-900">{session.correctCount}</span>
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: session.mistakeLimit }, (_, i) => (
                <span
                  key={i}
                  className={`text-base ${i < session.remainingLives ? "text-red-500" : "text-surface-200"}`}
                >
                  &#9829;
                </span>
              ))}
            </div>
          </div>
        </div>

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
          {FU_OPTIONS.map((fu) => {
            const isSelected = selectedFu === fu;
            const isCorrect = question.answer === fu;

            let borderClass = "border-surface-200";
            let bgClass = "bg-white hover:border-primary-300";

            if (session.showFeedback) {
              if (isCorrect) {
                borderClass = "border-green-500";
                bgClass = "bg-green-50";
              } else if (isSelected && !isCorrect) {
                borderClass = "border-red-500";
                bgClass = "bg-red-50";
              } else {
                bgClass = "bg-white opacity-50";
              }
            }

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

        {/* Feedback */}
        {session.showFeedback && (
          <div className="mt-4 rounded-xl bg-surface-50 p-4 text-center text-sm text-surface-600 animate-in fade-in slide-in-from-bottom-2">
            <span className="font-semibold">{question.shapeName}</span>
            {" — "}
            {question.explanation}
          </div>
        )}
      </div>
    </ContentContainer>
  );
}
