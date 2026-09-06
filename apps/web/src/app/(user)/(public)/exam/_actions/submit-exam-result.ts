"use server";

import { getOptionalVerifiedUser } from "@/lib/auth";
import { isPracticeMenuType } from "@/lib/db/practice-menu-types";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import { gradeExamRun } from "@/lib/db/rank-evaluation";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { logExternalError } from "@/lib/log-error";
import { evaluateExamEligibility } from "@/lib/ranks/exam-eligibility";
import { rankRequiringMenu, type RankSlug } from "@/lib/ranks/registry";

/**
 * `submitExamResult` の戻り値
 * 試験結果送信レスポンス
 *
 * - `{ success: true, grantedRanks }`: 採点済み。`grantedRanks` は今回の走行を
 *   機に新たに付与された段級位（0 件または 1 件）。不合格・再挑戦・既に
 *   保持している級の試験では空配列。
 * - `{ success: true, skipped: 'anonymous' }`: 未ログインユーザーによる呼び出し。
 *   エラーではなく「期待された no-op」を表す（play ページの受験ガードが
 *   未ログインを通さないため、通常は起きない）。
 * - `{ success: false, error: 'exam_locked' }`: 受験資格のない試験の走行。
 *   採点しない（UI は資格のない試験を開始させないため、通常は直接呼び出し
 *   でしか起きない）。
 * - `{ success: false, error }`: それ以外の失敗（バリデーション・DB エラー等）。
 */
export type SubmitExamResponse =
  | { readonly success: true; readonly grantedRanks: readonly RankSlug[] }
  | { readonly success: true; readonly skipped: "anonymous" }
  | { readonly success: false; readonly error: string };

/**
 * 昇級試験の走行を採点し、合格なら段級位を付与する Server Action
 * 試験結果送信
 *
 * @description
 * 試験の走行は記録しない。`challenge_results` / `challenge_best_scores` には
 * 書かず、ランキング・マイレコード・EXP のどれにも載らない。成果は段級位
 * （`user_ranks`）だけで表す。記録を残さないのは、試験が「同じ問題を繰り返して
 * 数字を伸ばす」類のものではなく、合否の判定だけが目的だから。
 *
 * 受験資格（次に取る級の試験か、達成済みの級の再挑戦）がないと採点しない。
 * 飛び級の禁止はページ側のガードだけでなくここでも強制する。付与の判定
 * （`gradeExamRun`）自体も「次の級の試験でなければ付与しない」ので、
 * 資格ガードは二重の安全装置。
 *
 * @param menuType - 試験の練習種別
 * @param score - 制限時間内の正解数
 */
export async function submitExamResult(
  menuType: PracticeMenuType,
  score: number,
): Promise<SubmitExamResponse> {
  try {
    const user = await getOptionalVerifiedUser();
    if (!user) {
      return { success: true, skipped: "anonymous" };
    }

    if (
      !isPracticeMenuType(menuType) ||
      rankRequiringMenu(menuType) === undefined
    ) {
      console.warn(`[submitExamResult] not an exam menuType: ${menuType}`);
      return { success: false, error: "invalid_menu_type" };
    }

    const eligibility = evaluateExamEligibility(
      menuType,
      await getUserRankSlugs(user.id),
    );
    if (eligibility?.kind === "locked") {
      console.warn(`[submitExamResult] exam locked: ${menuType}`);
      return { success: false, error: "exam_locked" };
    }

    const grantedRanks = await gradeExamRun(user.id, {
      menuType,
      score: Math.round(score),
    });
    return { success: true, grantedRanks };
  } catch (error) {
    logExternalError(
      "submitExamResult",
      `${menuType}: unexpected error during grading`,
      error,
    );
    return { success: false, error: "unexpected_error" };
  }
}
