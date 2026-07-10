"use client";

import { useEffect } from "react";
import Link from "next/link";

import { ContentContainer } from "./content-container";
import { PageTitle } from "./page-title";

interface ErrorFallbackProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
  /** 見出し（例: 「練習を読み込めませんでした」） */
  readonly title: string;
  /** 補足説明 */
  readonly description: string;
  /** 開発時の console.error に付けるタグ（例: "Practice"） */
  readonly logTag?: string;
  /** 戻りリンクの遷移先（既定: "/"） */
  readonly backHref?: string;
  /** 戻りリンクのラベル（既定: 「ホームへ戻る」） */
  readonly backLabel?: string;
}

/**
 * (user) シェル配下のエラー境界の共通フォールバック UI
 * エラーフォールバック
 *
 * NextIntlClientProvider が HMR 等で一時的に欠落するリスクを避けるため、
 * useTranslations は使わず、各 error.tsx が日本語文言を props で
 * ハードコード指定する（error boundary の HMR 耐性を優先する設計判断）。
 */
export function ErrorFallback({
  error,
  reset,
  title,
  description,
  logTag,
  backHref = "/",
  backLabel = "ホームへ戻る",
}: ErrorFallbackProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (logTag) {
        console.error(`[${logTag}]`, error);
      } else {
        console.error(error);
      }
    }
  }, [error, logTag]);

  return (
    <ContentContainer>
      <div className="flex flex-col items-center text-center py-16 space-y-6">
        <PageTitle>{title}</PageTitle>
        <p className="text-sm text-surface-600">{description}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            もう一度試す
          </button>
          <Link
            href={backHref}
            className="inline-flex items-center justify-center rounded-lg border border-surface-300 px-6 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-100"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </ContentContainer>
  );
}
