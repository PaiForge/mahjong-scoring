"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { generateTehaiFuQuestion, MentsuType, getKazeName } from "@mahjong-scoring/core";
import type { TehaiFuQuestion, TehaiFuItem } from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { ContentContainer } from "@/app/_components/content-container";
import { useTimedSession } from "../../_hooks/use-timed-session";
import { QuizTimer } from "../../_components/quiz-timer";
import { CHALLENGE_TIME_LIMIT } from "../../_lib/challenge-constants";

const FU_OPTIONS = [0, 2, 4, 8, 16, 32] as const;

function generateQuestion(): TehaiFuQuestion | undefined {
  for (let i = 0; i < 10; i++) {
    const q = generateTehaiFuQuestion();
    if (q) return q;
  }
  return undefined;
}

export function TehaiFuDrill() {
  const router = useRouter();
  const t = useTranslations("tehaiFu");
  const tc = useTranslations("challenge");
  const [question, setQuestion] = useState<TehaiFuQuestion | undefined>(generateQuestion);
  const [answers, setAnswers] = useState<string[]>(() =>
    new Array(5).fill("")
  );

  const session = useTimedSession();
  const handWrapperRef = useRef<HTMLDivElement>(null);
  const handContentRef = useRef<HTMLDivElement>(null);
  const [handScale, setHandScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const wrapper = handWrapperRef.current;
      const content = handContentRef.current;
      if (!wrapper || !content) return;
      // Reset scale to measure natural content width
      content.style.transform = "scale(1)";
      const naturalWidth = content.scrollWidth;
      const availableWidth = wrapper.clientWidth;
      const scale = naturalWidth > availableWidth ? availableWidth / naturalWidth : 1;
      content.style.transform = `scale(${scale})`;
      setHandScale(scale);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [question]);

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

  useEffect(() => {
    if (!session.isFinished) return;
    const params = new URLSearchParams({
      correct: session.correctCount.toString(),
      total: session.totalCount.toString(),
      time: session.elapsedMs.toString(),
    });
    router.push(`/practice/tehai-fu/result?${params.toString()}`);
  }, [session.isFinished, session.correctCount, session.totalCount, session.elapsedMs, router]);

  if (session.isFinished) {
    return undefined;
  }

  if (!question) return undefined;

  const allAnswered = answers.length > 0 && answers.every((a) => a !== "");

  const renderItemTiles = (item: TehaiFuItem) => {
    if (item.originalMentsu && (item.isOpen || item.type === MentsuType.Kantsu)) {
      return (
        <Furo
          mentsu={item.originalMentsu}
          furo={item.originalMentsu.furo}
          size="sm"
        />
      );
    }

    return (
      <div className="flex gap-0.5">
        {item.tiles.map((tile, i) => (
          <Hai key={i} hai={tile} size="sm" />
        ))}
      </div>
    );
  };

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

      <div className="mx-auto max-w-lg">
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

        {/* Hand display */}
        <div className="mt-4 rounded-xl border border-surface-200 bg-white p-2 shadow-sm">
          <div
            ref={handWrapperRef}
            className="relative overflow-hidden"
            style={{ height: `${45 * handScale}px` }}
          >
            <div
              ref={handContentRef}
              className="absolute left-0 top-0 flex items-end whitespace-nowrap"
              style={{ transformOrigin: "left top" }}
            >
              <div className="flex shrink-0">
                {question.tehai.closed.map((kindId, i) => (
                  <Hai key={i} hai={kindId} size="sm" />
                ))}
              </div>
              {question.tehai.exposed.length > 0 && (
                <div className="flex shrink-0 ml-1">
                  {question.tehai.exposed.map((mentsu, i) => (
                    <Furo key={i} mentsu={mentsu} furo={mentsu.furo} size="sm" />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex justify-center gap-6 text-xs">
            <div className="text-center">
              <span className="text-surface-400">{t("bakaze")}</span>
              <p className="mt-0.5 font-bold text-surface-900">
                {getKazeName(question.context.bakaze)}
              </p>
            </div>
            <div className="text-center">
              <span className="text-surface-400">{t("jikaze")}</span>
              <p className="mt-0.5 font-bold text-surface-900">
                {getKazeName(question.context.jikaze)}
              </p>
            </div>
            <div className="text-center">
              <span className="text-surface-400">{t("agari")}</span>
              <div className="mt-0.5 flex justify-center">
                <Hai hai={question.context.agariHai} size="sm" />
              </div>
            </div>
            <div className="text-center">
              <span className="text-surface-400">{t("agariType")}</span>
              <p className="mt-0.5 font-bold text-surface-900">
                {question.context.isTsumo ? t("tsumo") : t("ron")}
              </p>
            </div>
          </div>
        </div>

        {/* Item list */}
        <div className="mt-4 space-y-2">
          {question.items.map((item, idx) => {
            const answerNum = answers[idx] ? parseInt(answers[idx]) : undefined;
            const isCorrect = session.showFeedback && answerNum === item.fu;
            const isWrong = session.showFeedback && answerNum !== item.fu;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-3 ${
                  session.showFeedback
                    ? isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : "border-surface-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {renderItemTiles(item)}
                  {item.type === "Pair" && (
                    <span className="text-xs text-surface-400">{t("pair")}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isWrong && (
                    <span className="text-xs font-bold text-red-600">
                      {item.fu}符
                    </span>
                  )}
                  <select
                    className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm font-bold ${
                      session.showFeedback
                        ? isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                        : "border-surface-200"
                    }`}
                    value={answers[idx]}
                    onChange={(e) => handleSelect(idx, e.target.value)}
                    disabled={session.showFeedback || session.isCountingDown}
                  >
                    <option value="" disabled>
                      --
                    </option>
                    {FU_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}符
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
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
      </div>
    </ContentContainer>
  );
}
