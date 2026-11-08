"use client";

import { useEffect } from "react";
import Link from "next/link";

import { buttonClasses } from "./_lib/button-classes";
import { Button } from "./button";
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
  /** 再試行ボタンのラベル（既定: 「もう一度試す」） */
  readonly retryLabel?: string;
}

/**
 * (user) シェル配下のエラー境界の共通フォールバック UI
 * エラーフォールバック
 *
 * 文言はすべて props で受け取り、この部品自身は `useTranslations` を呼ばない
 * （NextIntlClientProvider が HMR 等で一時的に欠落しても描けるように）。
 * 日本語だけのページの error.tsx は日本語の文言を直接渡してよく、既定値も
 * 日本語にしてある。英語でも出る境界（`[locale]/(user)/error.tsx`・
 * `practice/error.tsx`）は、`errorPage` 名前空間から引いた文言を見出しから
 * 再試行ボタンまで全部渡す（1 つでも省くと、英語のページに日本語の既定値が混ざる）。
 *
 * 戻りリンク・再試行の既定値（日本語）は、日本語だけのページの境界
 * （マイページ・ランキング）が省略して使っているので残している。それらが英語で
 * 公開されるときに文言を渡す形へ直し、既定値を外してラベルを必須にする。
 */
export function ErrorFallback({
  error,
  reset,
  title,
  description,
  logTag,
  backHref = "/",
  backLabel = "ホームへ戻る",
  retryLabel = "もう一度試す",
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
          <Button onClick={reset}>{retryLabel}</Button>
          <Link
            href={backHref}
            className={buttonClasses({ variant: "neutral" })}
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </ContentContainer>
  );
}
