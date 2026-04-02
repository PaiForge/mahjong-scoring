"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface UseFinishRedirectOptions {
  /** ドリル終了フラグ */
  readonly isFinished: boolean;
  /** 正解数 */
  readonly correctCount: number;
  /** 合計回答数 */
  readonly totalCount: number;
  /** 経過時間（ミリ秒） */
  readonly elapsedMs: number;
  /** リダイレクト先パス（例: "/practice/jantou-fu/result"） */
  readonly resultPath: string;
}

/**
 * ドリル終了時にリザルトページへリダイレクトする
 * 終了時リダイレクト
 */
export function useFinishRedirect({
  isFinished,
  correctCount,
  totalCount,
  elapsedMs,
  resultPath,
}: UseFinishRedirectOptions) {
  const router = useRouter();

  useEffect(() => {
    if (!isFinished) return;
    const params = new URLSearchParams({
      correct: correctCount.toString(),
      total: totalCount.toString(),
      time: elapsedMs.toString(),
    });
    router.push(`${resultPath}?${params.toString()}`);
  }, [isFinished, correctCount, totalCount, elapsedMs, resultPath, router]);
}
