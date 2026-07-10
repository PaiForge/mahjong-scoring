"use client";

import { ErrorFallback } from "@/app/_components/error-fallback";

/**
 * (user) シェル内のエラー境界
 *
 * サイドバー / フッター等のナビゲーションは (user)/layout.tsx 側で
 * 維持されたまま、コンテンツ領域だけエラー表示に差し替わる。
 */
export default function UserError({
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
      title="問題が発生しました"
      description="予期しないエラーが発生しました。もう一度お試しください。"
    />
  );
}
