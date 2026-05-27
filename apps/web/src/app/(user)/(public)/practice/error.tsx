"use client";

import { useEffect } from "react";
import Link from "next/link";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

/**
 * 練習機能のエラー境界
 *
 * 練習一覧 / play / result / 説明ページのすべてをカバーする。
 * 練習中の問題生成や状態管理のエラーを (user) シェルを残したまま隔離し、
 * ユーザーが練習一覧へ戻れるようにする。
 *
 * useTranslations は HMR 耐性のため使わない。
 */
export default function PracticeError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[Practice]", error);
    }
  }, [error]);

  return (
    <ContentContainer>
      <div className="flex flex-col items-center text-center py-16">
        <PageTitle className="mb-3">練習を読み込めませんでした</PageTitle>
        <p className="text-sm text-surface-600 mb-8">
          一時的な問題が発生した可能性があります。もう一度お試しください。
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            もう一度試す
          </button>
          <Link
            href="/practice"
            className="inline-flex items-center justify-center rounded-lg border border-surface-300 px-6 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-100"
          >
            練習一覧へ戻る
          </Link>
        </div>
      </div>
    </ContentContainer>
  );
}
