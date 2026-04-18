"use server";

import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import { createClient } from "@/lib/supabase/server";

import type { ChallengeSession } from "../_lib/types";
import {
  fetchAvailableMenuTypes,
  fetchChallengeSessions,
} from "../_lib/queries";

/**
 * 指定メニュー・期間のチャレンジセッション一覧を取得する
 * チャレンジセッション取得アクション
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
    console.error(
      "Failed to fetch challenge sessions:",
      error instanceof Error ? error.message : String(error),
    );
    return { current: [], previous: [] };
  }
}

/**
 * ユーザーが記録を持つメニュー種別の一覧を返す
 * 利用可能メニュー取得アクション
 */
export async function getAvailableMenuTypes(): Promise<PracticeMenuType[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    return await fetchAvailableMenuTypes(user.id);
  } catch {
    return [];
  }
}
