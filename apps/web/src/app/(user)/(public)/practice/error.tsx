"use client";

import { ErrorFallback } from "@/app/_components/error-fallback";

/**
 * 練習機能のエラー境界
 *
 * 練習一覧 / play / result / 説明ページのすべてをカバーする。
 * 練習中の問題生成や状態管理のエラーを (user) シェルを残したまま隔離し、
 * ユーザーが練習一覧へ戻れるようにする。
 */
export default function PracticeError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      logTag="Practice"
      title="練習を読み込めませんでした"
      description="一時的な問題が発生した可能性があります。もう一度お試しください。"
      backHref="/practice"
      backLabel="練習一覧へ戻る"
    />
  );
}
