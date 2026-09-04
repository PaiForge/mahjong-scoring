"use server";

import { getOptionalUser } from "@/lib/auth";
import { logExternalError } from "@/lib/log-error";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";

import type { ChallengeAttempt } from "../_lib/types";
import { isMyRecordMenuType } from "../_lib/menu-scope";
import { fetchChallengeAttempts } from "../_lib/queries";

/**
 * 指定メニュー・期間のチャレンジ一覧を取得する
 * チャレンジ取得アクション
 *
 * 練習種別はクライアントから渡るため、マイレコードが扱わない種別
 * （昇級試験）はここでも弾く。画面から選べなくても、このアクションを
 * 直接呼べば試験の履歴を引けてしまう。
 */
export async function getChallengeAttempts(
  menuType: PracticeMenuType,
  currentRangeStart: Date,
  currentRangeEnd: Date,
  previousRangeStart: Date,
  previousRangeEnd: Date,
): Promise<{
  current: ChallengeAttempt[];
  previous: ChallengeAttempt[];
}> {
  try {
    const user = await getOptionalUser();

    if (!user || !isMyRecordMenuType(menuType)) {
      return { current: [], previous: [] };
    }

    return await fetchChallengeAttempts(
      user.id,
      menuType,
      currentRangeStart,
      currentRangeEnd,
      previousRangeStart,
      previousRangeEnd,
    );
  } catch (error) {
    logExternalError(
      "getChallengeAttempts",
      "failed to fetch challenge attempts",
      error,
    );
    return { current: [], previous: [] };
  }
}
