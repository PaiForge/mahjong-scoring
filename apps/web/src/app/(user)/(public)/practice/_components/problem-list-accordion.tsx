"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AccordionCard } from "@/app/(user)/_components/accordion-card";

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
 * 練習共通の問題別アコーディオン一覧
 * 問題一覧アコーディオン
 *
 * 各問を `AccordionCard` で折りたたみ表示し、正誤アイコンとカスタマイズ可能な
 * 詳細セクションを提供する。
 */
export function ProblemListAccordion<T>({
  results,
  translationNamespace,
  isCorrect,
  renderSummary,
  renderDetail,
}: ProblemListAccordionProps<T>) {
  const tResult = useTranslations(`${translationNamespace}.result`);

  if (results.length === 0) return undefined;

  return (
    <div className="mt-8 w-full space-y-2">
      <p className="text-left text-sm font-medium text-surface-500">
        {tResult("problemDetails")}
      </p>
      <div className="space-y-2">
        {results.map((result, index) => {
          const correct = isCorrect(result);

          return (
            <AccordionCard
              key={index}
              title={
                <>
                  <span className="font-medium whitespace-nowrap">
                    No.{index + 1}
                  </span>
                  {renderSummary && (
                    <span className="text-sm text-surface-500">
                      {renderSummary(result, index)}
                    </span>
                  )}
                </>
              }
              trailing={
                <>
                  {correct ? (
                    <svg
                      className="size-3 text-primary-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <svg
                      className="size-3 text-destructive"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  )}
                  <span
                    className={`text-sm font-medium ${correct ? "text-primary-500" : "text-destructive"}`}
                  >
                    {correct ? tResult("correct") : tResult("incorrect")}
                  </span>
                </>
              }
            >
              {renderDetail(result, index)}
            </AccordionCard>
          );
        })}
      </div>
    </div>
  );
}
