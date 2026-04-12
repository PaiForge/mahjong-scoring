'use server';

import { isPracticeMenuType } from '@/lib/db/practice-menu-types';
import type { PracticeMenuType } from '@/lib/db/practice-menu-types';
import { saveChallengeResult } from '@/lib/db/save-challenge-result';
import { createClient } from '@/lib/supabase/server';

/**
 * `savePracticeResult` の戻り値
 * 練習結果保存レスポンス
 *
 * - `{ success: true, challengeResultId }`: 認証済みユーザーの保存成功。
 * - `{ success: true, skipped: 'anonymous' }`: 未ログインユーザーによる呼び出し。
 *   エラーではなく「期待された no-op」を表す。呼び出し側は静かに無視すること。
 * - `{ success: false, error }`: それ以外の失敗（バリデーション・DB エラー等）。
 */
export type SaveResultResponse =
  | { readonly success: true; readonly challengeResultId: string }
  | { readonly success: true; readonly skipped: 'anonymous' }
  | { readonly success: false; readonly error: string };

const ALLOWED_LEADERBOARD_KEYS: ReadonlySet<string> = new Set(['default']);

export interface ChallengeFields {
  readonly score: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
}

/**
 * チャレンジ結果を challenge_results / challenge_best_scores に保存する Server Action
 * 練習結果保存
 *
 * @param menuType - 練習種別
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

    // 未ログインユーザーはエラーではなく「静かにスキップ」を返す。
    // これによりクライアント側で事前の認証チェックが不要になり、
    // `AuthProvider` の非同期ロード中の競合で正規ユーザーが匿名扱いされる
    // バグクラスを根絶する。Server の cookie ベース Supabase クライアントが
    // 唯一の信頼できる認証ソース。
    if (!user) {
      return { success: true, skipped: 'anonymous' };
    }

    if (!isPracticeMenuType(menuType)) {
      console.warn(`[savePracticeResult] invalid menuType: ${menuType}`);
      return { success: false, error: 'invalid_menu_type' };
    }

    if (!ALLOWED_LEADERBOARD_KEYS.has(leaderboardKey)) {
      console.warn(`[savePracticeResult] invalid leaderboardKey: ${leaderboardKey}`);
      return { success: false, error: 'invalid_leaderboard_key' };
    }

    const { challengeResultId } = await saveChallengeResult({
      userId: user.id,
      menuType,
      leaderboardKey,
      score: Math.round(challengeFields.score),
      incorrectAnswers: Math.round(challengeFields.incorrectAnswers),
      timeTaken: Math.round(challengeFields.timeTaken),
    });

    return { success: true, challengeResultId };
  } catch (error) {
    console.error(
      `[savePracticeResult] ${menuType}: unexpected error during save:`,
      error instanceof Error ? error.message : String(error),
    );
    return { success: false, error: 'unexpected_error' };
  }
}
