"use client";

import { ErrorFallback } from "@/app/(user)/_components/error-fallback";

/**
 * マイページのエラー境界
 *
 * 認証必須の Server Action / DB クエリ失敗をページ単位で隔離する。
 */
export default function MypageError({
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
      logTag="Mypage"
      title="マイページを読み込めませんでした"
      description="一時的な問題が発生した可能性があります。もう一度お試しください。"
    />
  );
}
