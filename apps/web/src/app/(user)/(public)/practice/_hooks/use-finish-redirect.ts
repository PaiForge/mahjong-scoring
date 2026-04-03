"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FinalResult } from "./use-timed-session";

/** ドリル終了時に呼び出されるコールバックの引数 */
export interface FinishCallbackArgs {
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly totalCount: number;
  readonly elapsedMs: number;
}

interface UseFinishRedirectOptions {
  /** ドリル終了フラグ */
  readonly isFinished: boolean;
  /**
   * ゲーム終了時の確定結果
   * 終了スナップショット
   *
   * ref ベースで取得されるため、React の state バッチングに依存しない正確な値を持つ。
   */
  readonly finalResult: FinalResult | undefined;
  /** 経過時間（ミリ秒） */
  readonly elapsedMs: number;
  /** リダイレクト先パス（例: "/practice/jantou-fu/result"） */
  readonly resultPath: string;
  /** ドリル終了時に呼び出されるコールバック（スコア保存等） */
  readonly onFinish?: (args: FinishCallbackArgs) => Promise<void> | void;
}

/**
 * ドリル終了時にリザルトページへリダイレクトする
 * 終了時リダイレクト
 *
 * `finalResult` が確定（undefined でない）かつ `isFinished` が true のとき、
 * `onFinish` コールバックを実行してからリダイレクトする。
 */
export function useFinishRedirect({
  isFinished,
  finalResult,
  elapsedMs,
  resultPath,
  onFinish,
}: UseFinishRedirectOptions) {
  const router = useRouter();
  const savedRef = useRef(false);

  useEffect(() => {
    if (!isFinished || !finalResult || savedRef.current) return;
    savedRef.current = true;

    const { correctCount, incorrectCount, totalCount } = finalResult;

    const params = new URLSearchParams({
      correct: correctCount.toString(),
      total: totalCount.toString(),
      time: elapsedMs.toString(),
    });
    const resultUrl = `${resultPath}?${params.toString()}`;

    if (onFinish) {
      const maybePromise = onFinish({ correctCount, incorrectCount, totalCount, elapsedMs });
      if (maybePromise) {
        maybePromise
          .catch((error: unknown) => {
            console.error("[useFinishRedirect] onFinish failed:", error);
          })
          .finally(() => {
            router.push(resultUrl);
          });
        return;
      }
    }

    router.push(resultUrl);
  }, [isFinished, finalResult, elapsedMs, resultPath, router, onFinish]);
}
