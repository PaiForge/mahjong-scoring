"use client";

import type { PracticeMenuType } from "@mahjong-scoring/features/practice-menu-types";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import type {
  FinishCallbackArgs,
  FinishCallbackResult,
} from "../../practice/_hooks/use-finish-redirect";
import { useFinishAction } from "../../practice/_hooks/use-finish-action";
import { submitExamResult } from "../_actions/submit-exam-result";

/**
 * 昇級試験の終了時に走行を採点するコールバックを返す
 * 終了時試験採点フック
 *
 * 通常の練習の `useSaveOnFinish` と同じ座（`createChallengePlayView` の
 * `onFinish`）に置く、試験用の対。走行は記録しないので結果ページに渡すのは
 * 付与された段級位（`promoted`）だけで、EXP 取得用の `grant` は返さない。
 *
 * 認証の扱いも `useSaveOnFinish` と同じ（{@link useFinishAction}）。
 *
 * @param menuType 試験の練習種別
 */
export function useSubmitExamOnFinish(
  menuType: PracticeMenuType,
): (args: FinishCallbackArgs) => Promise<FinishCallbackResult | undefined> {
  return useFinishAction(menuType, SUBMIT_EXAM_RESULT);
}

const SUBMIT_EXAM_RESULT = {
  action: submitExamResult,
  name: "submitExamResult",
  toResult: (result: { readonly grantedRanks: readonly RankSlug[] }) => ({
    promoted: result.grantedRanks,
  }),
};
