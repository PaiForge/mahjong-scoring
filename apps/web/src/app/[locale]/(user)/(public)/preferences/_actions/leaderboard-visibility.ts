"use server";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { getAuthState } from "@/lib/auth";
import { isHiddenFromLeaderboard } from "@/lib/db/leaderboard-visibility";
import { logExternalError } from "@/lib/log-error";
import { saveLeaderboardVisibility } from "@/lib/users/leaderboard-visibility";

/** ランキング非表示設定の失敗理由 */
export type SetLeaderboardVisibilityError =
  UserActionGuardErrorCode | "updateFailed";

export type SetLeaderboardVisibilityResult =
  ActionResult<SetLeaderboardVisibilityError>;

/**
 * ログイン中のユーザーがランキング非表示にしているかを返す Server Action。
 * ランキング非表示取得
 *
 * 未ログインなら false（＝既定の「表示する」）を返す。設定画面はログイン前でも
 * 描画されるため、ここで弾かずトグルの初期状態だけ返す。
 *
 * 読めなかったとき（ログイン済みか確かめられない・DB が読めない）は undefined。
 * false に畳むと、非表示にしている人のトグルが「表示する」に見え、押すと
 * 意図せず切り替わる。
 */
export async function getLeaderboardVisibility(): Promise<boolean | undefined> {
  const state = await getAuthState();
  if (state.kind === "unknown") return undefined;
  if (state.kind === "signedOut") return false;

  try {
    return await isHiddenFromLeaderboard(state.user.id);
  } catch (error) {
    logExternalError(
      "getLeaderboardVisibility",
      "failed to read leaderboard visibility",
      error,
    );
    return undefined;
  }
}

/**
 * ランキング非表示の設定を切り替える Server Action。
 * ランキング非表示設定
 *
 * @param hidden - true でランキングから外れる
 */
export async function setLeaderboardVisibility(
  hidden: boolean,
): Promise<SetLeaderboardVisibilityResult> {
  const guard = await guardUserAction("updateLeaderboardVisibility");
  if ("error" in guard) {
    return guard;
  }
  const { user } = guard;

  try {
    const { written } = await saveLeaderboardVisibility(user.id, hidden);
    if (!written) return { error: "unauthorized" };
  } catch (error) {
    logExternalError(
      "setLeaderboardVisibility",
      "failed to update leaderboard visibility",
      error,
    );
    return { error: "updateFailed" };
  }

  return { success: true };
}
