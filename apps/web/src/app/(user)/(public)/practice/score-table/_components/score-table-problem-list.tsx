"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ScoreTableQuestionResult } from "../_lib/types";
import { buildReferenceUrl } from "../_lib/build-reference-url";
import { formatAnswer } from "../_lib/format-answer";

interface ScoreTableProblemListProps {
  readonly results: readonly ScoreTableQuestionResult[];
}

/**
 * 点数表ドリルの問題別フィードバック一覧
 * 点数表問題一覧
 *
 * 各問をアコーディオン形式で表示し、正誤と正解・ユーザー回答の詳細を確認できる。
 */
export function ScoreTableProblemList({ results }: ScoreTableProblemListProps) {
  const t = useTranslations("scoreTableDrill");
  const tResult = useTranslations("scoreTableDrill.result");
  const [expandedProblems, setExpandedProblems] = useState<Set<number>>(new Set());

  const toggleProblem = (index: number) => {
    setExpandedProblems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (results.length === 0) return undefined;

  return (
    <div className="mt-8 w-full max-w-md">
      <p className="mb-2 text-left text-sm font-medium text-surface-500">
        {tResult("problemDetails")}
      </p>
      <div className="space-y-2">
        {results.map((result, index) => {
          const isExpanded = expandedProblems.has(index);
          const summary = [
            result.isOya ? t("oya") : t("ko"),
            result.isTsumo ? t("tsumo") : t("ron"),
            t("han", { count: result.han }),
            t("fu", { count: result.fu }),
          ].join("\u30FB");

          return (
            <div key={index} className="overflow-hidden rounded-lg border border-surface-200">
              <button
                type="button"
                onClick={() => toggleProblem(index)}
                className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-surface-50"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <svg
                    className={`size-3 flex-shrink-0 text-surface-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="font-medium whitespace-nowrap">No.{index + 1}</span>
                  <span className="text-sm text-surface-500">{summary}</span>
                </div>
                <div className="ml-2 flex flex-shrink-0 items-center gap-1">
                  {result.isCorrect ? (
                    <svg className="size-3 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <svg className="size-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  )}
                  <span
                    className={`text-sm font-medium ${result.isCorrect ? "text-green-500" : "text-red-500"}`}
                  >
                    {result.isCorrect ? tResult("correct") : tResult("incorrect")}
                  </span>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-surface-200 bg-surface-50 px-3 pb-3 pt-3">
                  <div className="space-y-1 text-sm">
                    <p className="text-surface-500">
                      <span className="font-medium">{tResult("correctAnswer")}:</span>{" "}
                      <Link
                        href={buildReferenceUrl(result)}
                        className="text-primary-600 underline hover:text-primary-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {formatAnswer(result.correctAnswer, t)}
                      </Link>
                    </p>
                    <p
                      className={result.isCorrect ? "text-green-600" : "text-red-600"}
                    >
                      <span className="font-medium">{tResult("yourAnswer")}:</span>{" "}
                      {formatAnswer(result.userAnswer, t)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
