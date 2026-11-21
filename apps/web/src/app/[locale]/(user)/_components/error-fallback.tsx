"use client";

import { useEffect } from "react";
import Link from "next/link";

import { buttonClasses } from "./_lib/button-classes";
import { Button } from "./button";
import { ContentContainer } from "./content-container";
import { PageTitle } from "./page-title";

interface ErrorFallbackProps {
  readonly error: Error & { digest?: string };
  /** error.tsx が受け取る `retry`（サーバーから取り直して描き直す） */
  readonly retry: () => void;
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
 * @design 再試行は `reset` ではなく `retry`
 * この境界に落ちる失敗の多くは、サーバーでの描画の失敗（DB・認証サーバーに
 * 届かない）。error.tsx の `reset` は境界のエラー状態を消して子を描き直すだけで、
 * サーバーから取り直さない — 失敗した応答をもう一度描くので、障害が直っていても
 * 同じエラーに戻る。`retry`（Next 16.3 で安定）は `router.refresh()` と `reset` を
 * 1 つの transition で行い、サーバーの描画からやり直す（実装は
 * `next/dist/client/components/error-boundary.js` の `retry`）。クライアントで
 * 投げられたエラーも、エラー状態を消す所は同じなので `retry` で足りる。
 *
 * 戻りリンク・再試行の既定値（日本語）は、日本語だけのページの境界
 * （マイページ・ランキング）が省略して使っているので残している。それらが英語で
 * 公開されるときに文言を渡す形へ直し、既定値を外してラベルを必須にする。
 */
export function ErrorFallback({
  error,
  retry,
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
          <Button onClick={retry}>{retryLabel}</Button>
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
