"use client";

import { useCallback } from "react";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import type { FinishCallbackArgs, FinishCallbackResult } from "./use-finish-redirect";
import { savePracticeResult } from "../_actions/save-practice-result";

/**
 * 練習終了時にチャレンジ結果を保存するコールバックを返す
 * 終了時スコア保存フック
 *
 * 認証チェックは Server Action 側が行う（cookie ベースの Supabase サーバークライアントが
 * 唯一の信頼できる認証ソース）。クライアント側で認証状態を先読みしない。
 * 過去に認証コンテキストの初期ロード中にチャレンジが終了した場合の競合条件で、
 * 認証済みユーザーが匿名扱いされて EXP 付与がスキップされるバグを 2 回起こしたため、
 * **クライアント側の事前認証チェックは意図的に一切行わない**。
 *
 * Server Action は匿名ユーザーからの呼び出しを `{ success: true, skipped: 'anonymous' }`
 * として返し、このフックはそれを `undefined` に変換してサイレントに no-op する。
 * これにより匿名ユーザーに対する `console.error` のノイズも発生しない。
 *
 * @param menuType 練習種別（練習メニュー種別）
 */
export function useSaveOnFinish(
  menuType: PracticeMenuType,
): (args: FinishCallbackArgs) => Promise<FinishCallbackResult | undefined> {
  return useCallback(
    async (args: FinishCallbackArgs) => {
      if (args.totalCount === 0) return undefined;

      try {
        const result = await savePracticeResult(menuType, "default", {
          score: args.correctCount,
          incorrectAnswers: args.incorrectCount,
          timeTaken: Math.round(args.elapsedMs / 1000),
        });
        if (!result.success) {
          console.error(`[savePracticeResult] ${menuType}:`, result.error);
          return undefined;
        }
        if ("skipped" in result) {
          // 匿名ユーザー: 期待される no-op（エラーではない）
          return undefined;
        }
        return { grant: result.challengeResultId };
      } catch (error: unknown) {
        console.error(`[savePracticeResult] ${menuType}:`, error);
        return undefined;
      }
    },
    [menuType],
  );
}
