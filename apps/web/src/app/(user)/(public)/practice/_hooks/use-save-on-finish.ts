"use client";

import { useCallback } from "react";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import type { FinishCallbackArgs } from "./use-finish-redirect";
import { savePracticeResult } from "../_actions/save-practice-result";

/**
 * ドリル終了時にチャレンジ結果を保存するコールバックを返す
 * 終了時スコア保存フック
 *
 * @param menuType - ドリル種別（練習メニュー種別）
 * @returns `DrillShell` の `onFinish` に渡せるコールバック
 */
export function useSaveOnFinish(
  menuType: PracticeMenuType,
): (args: FinishCallbackArgs) => Promise<void> {
  return useCallback(
    async (args: FinishCallbackArgs) => {
      if (args.totalCount === 0) return;
      try {
        const result = await savePracticeResult(menuType, "default", {
          score: args.correctCount,
          incorrectAnswers: args.incorrectCount,
          timeTaken: Math.round(args.elapsedMs / 1000),
        });
        if (!result.success) {
          console.error(`[savePracticeResult] ${menuType}:`, result.error);
        }
      } catch (error: unknown) {
        console.error(`[savePracticeResult] ${menuType}:`, error);
      }
    },
    [menuType],
  );
}
