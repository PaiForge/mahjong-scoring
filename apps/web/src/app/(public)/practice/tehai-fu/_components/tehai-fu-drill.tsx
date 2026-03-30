"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateTehaiFuQuestion, MentsuType } from "@mahjong-scoring/core";
import type { TehaiFuQuestion, TehaiFuItem } from "@mahjong-scoring/core";
import { Hai, Furo, Tehai } from "@pai-forge/mahjong-react-ui";
import { ContentContainer } from "@/app/_components/content-container";
import { getKazeName } from "@mahjong-scoring/core";

const FU_OPTIONS = [0, 2, 4, 8, 16, 32] as const;

function generateQuestion(): TehaiFuQuestion | undefined {
  for (let i = 0; i < 10; i++) {
    const q = generateTehaiFuQuestion();
    if (q) return q;
  }
  return undefined;
}

export function TehaiFuDrill() {
  const t = useTranslations("tehaiFu");
  const tc = useTranslations("challenge");
  const [question, setQuestion] = useState<TehaiFuQuestion | undefined>();
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    nextQuestion();
  }, []);

  const nextQuestion = useCallback(() => {
    const q = generateQuestion();
    setQuestion(q);
    if (q) {
      setAnswers(new Array(q.items.length).fill(""));
    }
    setIsSubmitted(false);
  }, []);

  const handleSelect = useCallback(
    (idx: number, value: string) => {
      if (isSubmitted) return;
      setAnswers((prev) => {
        const next = [...prev];
        next[idx] = value;
        return next;
      });
    },
    [isSubmitted],
  );

  const allAnswered = answers.length > 0 && answers.every((a) => a !== "");

  if (!question) return undefined;

  const correctCount = isSubmitted
    ? question.items.reduce(
        (acc, item, idx) => acc + (parseInt(answers[idx]) === item.fu ? 1 : 0),
        0,
      )
    : 0;

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
      <div className="mx-auto max-w-lg">
        {/* Hand display */}
        <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
          <div className="flex justify-center">
            <Tehai tehai={question.tehai} size="sm" />
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
                <Hai hai={question.context.agariHai} size="xs" />
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
        <div className="mt-4 space-y-3">
          {question.items.map((item, idx) => {
            const answerNum = answers[idx] ? parseInt(answers[idx]) : undefined;
            const isCorrect = isSubmitted && answerNum === item.fu;
            const isWrong = isSubmitted && answerNum !== item.fu;

            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-white p-3 shadow-sm ${
                  isSubmitted
                    ? isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : "border-surface-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {renderItemTiles(item)}
                    {item.type === "Pair" && (
                      <span className="text-xs text-surface-400">{t("pair")}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isSubmitted && (
                      <span
                        className={`text-xs font-bold ${isCorrect ? "text-green-700" : "text-red-700"}`}
                      >
                        {isCorrect ? tc("correct") : tc("incorrect")}
                      </span>
                    )}
                    <select
                      className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm font-bold ${
                        isSubmitted
                          ? isCorrect
                            ? "border-green-500 bg-green-50"
                            : "border-red-500 bg-red-50"
                          : "border-surface-200"
                      }`}
                      value={answers[idx]}
                      onChange={(e) => handleSelect(idx, e.target.value)}
                      disabled={isSubmitted}
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

                {isWrong && (
                  <p className="mt-2 text-xs text-red-600">
                    {t("correctAnswer", { fu: item.fu })} — {item.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Result summary */}
        {isSubmitted && (
          <div className="mt-4 rounded-xl border border-surface-200 bg-white p-4 text-center shadow-sm">
            <p className="text-lg font-bold text-primary-600">
              {tc("resultScore", { correct: correctCount, total: question.items.length })}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {!isSubmitted ? (
            <>
              <button
                type="button"
                onClick={() => setIsSubmitted(true)}
                disabled={!allAnswered}
                className={`w-full rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
                  allAnswered
                    ? "bg-primary-500 hover:bg-primary-600"
                    : "cursor-not-allowed bg-surface-300"
                }`}
              >
                {t("checkButton")}
              </button>
              <button
                type="button"
                onClick={nextQuestion}
                className="w-full text-center text-sm text-surface-400 hover:text-surface-600 transition-colors"
              >
                {t("skip")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={nextQuestion}
              className="w-full rounded-lg bg-primary-500 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
            >
              {t("nextQuestion")}
            </button>
          )}
        </div>
      </div>
    </ContentContainer>
  );
}
