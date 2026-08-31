"use server";

import { getOptionalVerifiedUser } from "@/lib/auth";
import { logExternalError } from "@/lib/log-error";
import { isPracticeMenuType } from "@/lib/db/practice-menu-types";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import { checkAndGrantRanks } from "@/lib/db/rank-evaluation";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { saveChallengeResult } from "@/lib/db/save-challenge-result";
import { evaluateExamEligibility } from "@/lib/ranks/exam-eligibility";
import { rankRequiringMenu, type RankSlug } from "@/lib/ranks/registry";

/**
 * `savePracticeResult` の戻り値
 * 練習結果保存レスポンス
 *
 * - `{ success: true, challengeResultId, grantedRanks }`: 認証済みユーザーの保存成功。
 *   `grantedRanks` は今回の保存を機に新たに付与された段級位（通常は空配列）。
 *   昇級判定自体が失敗した場合も保存は成功として返し、`grantedRanks` は空になる。
 * - `{ success: true, skipped: 'anonymous' }`: 未ログインユーザーによる呼び出し。
 *   エラーではなく「期待された no-op」を表す。呼び出し側は静かに無視すること。
 * - `{ success: false, error: 'exam_locked' }`: 受験資格のない昇級試験の結果。
 *   保存しない（UI は資格のない試験を開始させないため、通常は直接呼び出しでしか
 *   起きない）。
 * - `{ success: false, error }`: それ以外の失敗（バリデーション・DB エラー等）。
 */
export type SaveResultResponse =
  | {
      readonly success: true;
      readonly challengeResultId: string;
      readonly grantedRanks: readonly RankSlug[];
    }
  | { readonly success: true; readonly skipped: "anonymous" }
  | { readonly success: false; readonly error: string };

const ALLOWED_LEADERBOARD_KEYS: ReadonlySet<string> = new Set(["default"]);

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
    const user = await getOptionalVerifiedUser();

    // 未ログインユーザーはエラーではなく「静かにスキップ」を返す。
    // これによりクライアント側で事前の認証チェックが不要になり、
    // `AuthProvider` の非同期ロード中の競合で正規ユーザーが匿名扱いされる
    // バグクラスを根絶する。Server の cookie ベース Supabase クライアントが
    // 唯一の信頼できる認証ソース。
    if (!user) {
      return { success: true, skipped: "anonymous" };
    }

    if (!isPracticeMenuType(menuType)) {
      console.warn(`[savePracticeResult] invalid menuType: ${menuType}`);
      return { success: false, error: "invalid_menu_type" };
    }

    if (!ALLOWED_LEADERBOARD_KEYS.has(leaderboardKey)) {
      console.warn(
        `[savePracticeResult] invalid leaderboardKey: ${leaderboardKey}`,
      );
      return { success: false, error: "invalid_leaderboard_key" };
    }

    // 昇級試験は受験資格（次に取る級の試験か、達成済みの級の再挑戦）が
    // ないと保存しない。飛び級の禁止はページ側のガードだけでなくここでも
    // 強制する — 資格外の合格スコアがベストスコアに積まれると、順番が
    // 来たときに無受験で昇級してしまうため。段級位の取得は試験のときだけ
    // 行う（それ以外の練習の保存に余計なクエリを足さない）
    if (rankRequiringMenu(menuType) !== undefined) {
      const eligibility = evaluateExamEligibility(
        menuType,
        await getUserRankSlugs(user.id),
      );
      if (eligibility?.kind === "locked") {
        console.warn(`[savePracticeResult] exam locked: ${menuType}`);
        return { success: false, error: "exam_locked" };
      }
    }

    const { challengeResultId } = await saveChallengeResult({
      userId: user.id,
      menuType,
      leaderboardKey,
      score: Math.round(challengeFields.score),
      incorrectAnswers: Math.round(challengeFields.incorrectAnswers),
      timeTaken: Math.round(challengeFields.timeTaken),
    });

    // 昇級判定はベストスコア更新のコミット後に実行する。
    // 判定の失敗が結果保存を壊さないよう、失敗時は空配列で握りつぶす
    // （次回の保存時に再評価されるため取りこぼしにはならない）
    let grantedRanks: readonly RankSlug[] = [];
    try {
      grantedRanks = await checkAndGrantRanks(user.id);
    } catch (error) {
      logExternalError(
        "checkAndGrantRanks",
        `${menuType}: rank evaluation failed`,
        error,
      );
    }

    return { success: true, challengeResultId, grantedRanks };
  } catch (error) {
    logExternalError(
      "savePracticeResult",
      `${menuType}: unexpected error during save`,
      error,
    );
    return { success: false, error: "unexpected_error" };
  }
}
