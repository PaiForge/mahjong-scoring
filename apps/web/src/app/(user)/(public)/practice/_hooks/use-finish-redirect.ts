"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FinalResult } from "./use-timed-session";

/** 練習終了時に呼び出されるコールバックの引数 */
export interface FinishCallbackArgs {
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly totalCount: number;
  readonly elapsedMs: number;
}

/**
 * 練習終了コールバックの返り値
 * 終了コールバック結果
 *
 * `grant` が設定されている場合、結果ページの URL に `grant=<id>` クエリパラメータとして
 * 付与される。これは `challenge_results.id` で、結果ページでの EXP 付与情報の
 * サーバーサイド再取得に使用される。
 */
export interface FinishCallbackResult {
  readonly grant?: string;
}

interface UseFinishRedirectOptions {
  /** 練習終了フラグ */
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
  /**
   * 練習終了時に呼び出されるコールバック（スコア保存等）
   * `FinishCallbackResult` を返すと、結果ページ URL にクエリパラメータが追加される。
   */
  readonly onFinish?: (
    args: FinishCallbackArgs,
  ) => Promise<FinishCallbackResult | void | undefined> | FinishCallbackResult | void;
}

/**
 * 練習終了時にリザルトページへリダイレクトする
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

    const buildResultUrl = (grant?: string): string => {
      const params = new URLSearchParams({
        correct: correctCount.toString(),
        total: totalCount.toString(),
        time: elapsedMs.toString(),
      });
      if (grant) params.set("grant", grant);
      return `${resultPath}?${params.toString()}`;
    };

    void (async () => {
      try {
        const result = onFinish
          ? await Promise.resolve(onFinish({ correctCount, incorrectCount, totalCount, elapsedMs }))
          : undefined;
        const grant = result && "grant" in result ? result.grant : undefined;
        router.push(buildResultUrl(grant));
      } catch (error: unknown) {
        console.error("[useFinishRedirect] onFinish failed:", error);
        router.push(buildResultUrl());
      }
    })();
  }, [isFinished, finalResult, elapsedMs, resultPath, router, onFinish]);
}
