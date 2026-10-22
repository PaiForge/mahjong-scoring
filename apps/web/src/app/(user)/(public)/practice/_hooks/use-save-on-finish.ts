"use client";

import type { PracticeMenuType } from "@mahjong-scoring/features/practice-menu-types";
import type {
  FinishCallbackArgs,
  FinishCallbackResult,
} from "./use-finish-redirect";
import { useFinishAction } from "./use-finish-action";
import { savePracticeResult } from "../_actions/save-practice-result";

/**
 * 練習終了時にチャレンジ結果を保存するコールバックを返す
 * 終了時スコア保存フック
 *
 * 昇級試験には使わない（試験は記録を残さず採点だけする —
 * `exam/_hooks/use-submit-exam-on-finish.ts`）。
 *
 * 保存先の土俵（`leaderboardKey`）は終了時の引数 `variant` — URL の
 * `?variant=` を `useFinishRedirect` が読んで渡してくる。
 *
 * 認証の扱い（クライアント側で先読みしない・匿名のスキップは無言の no-op）は
 * {@link useFinishAction}。
 *
 * @param menuType 練習種別（練習メニュー種別）
 */
export function useSaveOnFinish(
  menuType: PracticeMenuType,
): (args: FinishCallbackArgs) => Promise<FinishCallbackResult | undefined> {
  return useFinishAction(menuType, SAVE_PRACTICE_RESULT);
}

const SAVE_PRACTICE_RESULT = {
  action: savePracticeResult,
  name: "savePracticeResult",
  toResult: (result: { readonly challengeResultId: string }) => ({
    grant: result.challengeResultId,
  }),
};
