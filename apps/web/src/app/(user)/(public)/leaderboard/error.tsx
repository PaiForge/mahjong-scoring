"use client";

import { ErrorFallback } from "@/app/_components/error-fallback";

/**
 * ランキング用エラー境界
 *
 * 集計クエリ / データフェッチの失敗をページ単位で隔離する。
 */
export default function LeaderboardError({
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
      logTag="Leaderboard"
      title="ランキングを読み込めませんでした"
      description="一時的な問題が発生した可能性があります。もう一度お試しください。"
    />
  );
}
