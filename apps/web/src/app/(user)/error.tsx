"use client";

import { useEffect } from "react";
import Link from "next/link";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

/**
 * (user) シェル内のエラー境界
 *
 * サイドバー / フッター等のナビゲーションは (user)/layout.tsx 側で
 * 維持されたまま、コンテンツ領域だけエラー表示に差し替わる。
 *
 * NextIntlClientProvider が HMR 等で一時的に欠落するリスクを避けるため、
 * useTranslations は使わず日本語をハードコードで持つ。
 */
export default function UserError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <ContentContainer>
      <div className="flex flex-col items-center text-center py-16">
        <PageTitle className="mb-3">問題が発生しました</PageTitle>
        <p className="text-sm text-surface-600 mb-8">
          予期しないエラーが発生しました。もう一度お試しください。
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
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-surface-300 px-6 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-100"
          >
            ホームへ戻る
          </Link>
        </div>
      </div>
    </ContentContainer>
  );
}
