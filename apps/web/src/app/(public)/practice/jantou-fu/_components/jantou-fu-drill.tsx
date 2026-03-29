"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  generateJantouFuQuestion,
  getKazeName,
} from "@mahjong-scoring/core";
import type { JantouFuQuestion, JantouFuChoice } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { QuizTimer } from "../../_components/quiz-timer";
import { CHALLENGE_TIME_LIMIT } from "../../_lib/challenge-constants";

export function JantouFuDrill() {
  const router = useRouter();
  const t = useTranslations("jantouFu");
  const tc = useTranslations("challenge");
  const [question, setQuestion] = useState<JantouFuQuestion>(
    generateJantouFuQuestion
  );

  const session = useTimedSession();

  const advanceQuestion = useCallback(() => {
    setQuestion(generateJantouFuQuestion());
  }, []);

  const handleChoiceClick = useCallback(
    (choice: JantouFuChoice) => {
      session.handleAnswer(choice.isCorrect, advanceQuestion);
    },
    [session, advanceQuestion]
  );

  // Finished → redirect to result via useEffect (not during render)
  useEffect(() => {
    if (!session.isFinished) return;
    const params = new URLSearchParams({
      correct: session.correctCount.toString(),
      total: session.totalCount.toString(),
      time: session.elapsedMs.toString(),
    });
    router.push(`/practice/jantou-fu/play/result?${params.toString()}`);
  }, [session.isFinished, session.correctCount, session.totalCount, session.elapsedMs, router]);

  if (session.isFinished) {
    return null;
  }

  return (
    <div className="px-6 py-6">
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
            let borderClass = "border-surface-200";
            let bgClass = "bg-white hover:border-primary-300";

            if (session.showFeedback) {
              if (choice.isCorrect) {
                borderClass = "border-green-500";
                bgClass = "bg-green-50";
              } else if (
                session.lastAnswerCorrect === false &&
                !choice.isCorrect
              ) {
                bgClass = "bg-white opacity-50";
              }
            }

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
                {session.showFeedback && (
                  <span className="text-xs text-surface-500">
                    {t("fu", { value: choice.fu })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
