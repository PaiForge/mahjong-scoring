"use client";

import { useCallback } from "react";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import { logExternalError } from "@/lib/log-error";
import type {
  FinishCallbackArgs,
  FinishCallbackResult,
} from "../../practice/_hooks/use-finish-redirect";
import { submitExamResult } from "../_actions/submit-exam-result";

/**
 * 昇級試験の終了時に走行を採点するコールバックを返す
 * 終了時試験採点フック
 *
 * 通常の練習の `useSaveOnFinish` と同じ座（`createChallengePlayView` の
 * `onFinish`）に置く、試験用の対。走行は記録しないので結果ページに渡すのは
 * 付与された段級位（`promoted`）だけで、EXP 取得用の `grant` は返さない。
 *
 * 認証の扱いも `useSaveOnFinish` と同じ — クライアント側で認証状態を
 * 先読みせず、Server Action の匿名スキップを `undefined` に変換して
 * サイレントに no-op する。
 *
 * @param menuType 試験の練習種別
 */
export function useSubmitExamOnFinish(
  menuType: PracticeMenuType,
): (args: FinishCallbackArgs) => Promise<FinishCallbackResult | undefined> {
  return useCallback(
    async (args: FinishCallbackArgs) => {
      if (args.totalCount === 0) return undefined;

      try {
        const result = await submitExamResult(menuType, args.correctCount);
        if (!result.success) {
          logExternalError("submitExamResult", menuType, result.error);
          return undefined;
        }
        if ("skipped" in result) {
          return undefined;
        }
        return { promoted: result.grantedRanks };
      } catch (error: unknown) {
        logExternalError("submitExamResult", menuType, error);
        return undefined;
      }
    },
    [menuType],
  );
}
