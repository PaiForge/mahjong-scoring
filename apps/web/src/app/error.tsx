"use client";

import { useEffect } from "react";
import Link from "next/link";

// ルート 404/500 は (user) 配下ではないが、ユーザーに見える画面なので
// ブランド UI のボタンを使う（admin 配下のエラーもここに落ちる）。
import { buttonClasses } from "@/app/(user)/_components/_lib/button-classes";
import { Button } from "@/app/(user)/_components/button";

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
    <div className="flex items-center justify-center min-h-screen bg-surface-50 px-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-surface-900 mb-3">
          問題が発生しました
        </h1>
        <p className="text-sm text-surface-600 mb-8">
          予期しないエラーが発生しました。もう一度お試しください。
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={reset}>もう一度試す</Button>
          <Link href="/" className={buttonClasses({ variant: "neutral" })}>
            ホームへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
