"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface ProblemListAccordionProps<T> {
  readonly results: readonly T[];
  /** i18n の翻訳ネームスペース（result.problemDetails, result.correct, result.incorrect を含む） */
  readonly translationNamespace: string;
  /** 正誤を判定する関数 */
  readonly isCorrect: (result: T) => boolean;
  /** ヘッダー右側に表示するサマリーテキスト（任意） */
  readonly renderSummary?: (result: T, index: number) => ReactNode;
  /** 展開時の詳細コンテンツ */
  readonly renderDetail: (result: T, index: number) => ReactNode;
}

/**
 * ドリル共通の問題別アコーディオン一覧
 * 問題一覧アコーディオン
 *
 * 各問を折りたたみ形式で表示し、正誤アイコンとカスタマイズ可能な詳細セクションを提供する。
 */
export function ProblemListAccordion<T>({
  results,
  translationNamespace,
  isCorrect,
  renderSummary,
  renderDetail,
}: ProblemListAccordionProps<T>) {
  const tResult = useTranslations(`${translationNamespace}.result`);
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
          const correct = isCorrect(result);

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
                  {renderSummary && (
                    <span className="text-sm text-surface-500">{renderSummary(result, index)}</span>
                  )}
                </div>
                <div className="ml-2 flex flex-shrink-0 items-center gap-1">
                  {correct ? (
                    <svg className="size-3 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <svg className="size-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  )}
                  <span
                    className={`text-sm font-medium ${correct ? "text-green-500" : "text-red-500"}`}
                  >
                    {correct ? tResult("correct") : tResult("incorrect")}
                  </span>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-surface-200 bg-surface-50 px-3 pb-3 pt-3">
                  {renderDetail(result, index)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
