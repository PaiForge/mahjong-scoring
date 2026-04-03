'use server';

import { isPracticeMenuType } from '@/lib/db/practice-menu-types';
import type { PracticeMenuType } from '@/lib/db/practice-menu-types';
import { saveChallengeResult } from '@/lib/db/save-challenge-result';
import { createClient } from '@/lib/supabase/server';

export type SaveResultResponse =
  | { readonly success: true }
  | { readonly success: false; readonly error: string };

export interface ChallengeFields {
  readonly score: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
}

/**
 * チャレンジ結果を challenge_results / challenge_best_scores に保存する Server Action
 * ドリル結果保存
 *
 * @param menuType - ドリル種別
 * @param leaderboardKey - ランキングセグメントキー
 * @param challengeFields - スコア、誤答数、経過時間
 */
export async function savePracticeResult(
  menuType: PracticeMenuType,
  leaderboardKey: string,
  challengeFields: ChallengeFields,
): Promise<SaveResultResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'auth_failed' };
    }

    if (!isPracticeMenuType(menuType)) {
      console.warn(`[savePracticeResult] invalid menuType: ${menuType}`);
      return { success: false, error: 'invalid_menu_type' };
    }

    await saveChallengeResult({
      userId: user.id,
      menuType,
      leaderboardKey,
      score: Math.round(challengeFields.score),
      incorrectAnswers: Math.round(challengeFields.incorrectAnswers),
      timeTaken: Math.round(challengeFields.timeTaken),
    });

    return { success: true };
  } catch (error) {
    console.error(`[savePracticeResult] ${menuType}: unexpected error during save:`, error);
    return { success: false, error: 'unexpected_error' };
  }
}
