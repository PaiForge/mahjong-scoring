"use server";

import { getOptionalUser } from "@/lib/auth";
import { logExternalError } from "@/lib/log-error";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";

import type { ChallengeSession } from "../_lib/types";
import { isMyRecordMenuType } from "../_lib/menu-scope";
import { fetchChallengeSessions } from "../_lib/queries";

/**
 * 指定メニュー・期間のチャレンジセッション一覧を取得する
 * チャレンジセッション取得アクション
 *
 * 練習種別はクライアントから渡るため、マイレコードが扱わない種別
 * （昇級試験）はここでも弾く。画面から選べなくても、このアクションを
 * 直接呼べば試験の履歴を引けてしまう。
 */
export async function getChallengeSessions(
  menuType: PracticeMenuType,
  currentRangeStart: Date,
  currentRangeEnd: Date,
  previousRangeStart: Date,
  previousRangeEnd: Date,
): Promise<{
  current: ChallengeSession[];
  previous: ChallengeSession[];
}> {
  try {
    const user = await getOptionalUser();

    if (!user || !isMyRecordMenuType(menuType)) {
      return { current: [], previous: [] };
    }

    return await fetchChallengeSessions(
      user.id,
      menuType,
      currentRangeStart,
      currentRangeEnd,
      previousRangeStart,
      previousRangeEnd,
    );
  } catch (error) {
    logExternalError(
      "getChallengeSessions",
      "failed to fetch challenge sessions",
      error,
    );
    return { current: [], previous: [] };
  }
}
