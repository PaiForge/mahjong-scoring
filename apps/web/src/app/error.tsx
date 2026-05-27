"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Root Error Boundary
 *
 * ルートレベルのエラー境界。(user) シェルが落ちた場合や
 * admin / auth / api 配下のエラーをキャッチする。
 *
 * NextIntlClientProvider が HMR 等で一時的に欠落するリスクを避けるため、
 * useTranslations は使わず日本語をハードコードで持つ。
 * 通常の (user) 配下のエラーは (user)/error.tsx で先にキャッチされる。
 */
export default function RootError({
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
    <div
      className="flex items-center justify-center min-h-screen bg-surface-50 px-6"
    >
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-surface-900 mb-3">
          問題が発生しました
        </h1>
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
    </div>
  );
}
