"use server";

import { eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { getOptionalUser } from "@/lib/auth";
import { purgeLeaderboardCache } from "@/lib/cache-tags";
import { profiles } from "@/lib/db";
import { isHiddenFromLeaderboard } from "@/lib/db/leaderboard-visibility";
import { logExternalError } from "@/lib/log-error";
import { writeAsAccount } from "@/lib/users/account-write-lock";

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
 */
export async function getLeaderboardVisibility(): Promise<boolean> {
  const user = await getOptionalUser();
  if (!user) {
    return false;
  }

  return isHiddenFromLeaderboard(user.id);
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
    const { written } = await writeAsAccount(user.id, (tx) =>
      tx
        .update(profiles)
        .set({ hiddenFromLeaderboard: hidden, updatedAt: new Date() })
        .where(eq(profiles.id, user.id)),
    );
    if (!written) return { error: "unauthorized" };
  } catch (error) {
    logExternalError(
      "setLeaderboardVisibility",
      "failed to update leaderboard visibility",
      error,
    );
    return { error: "updateFailed" };
  }

  // ランキングのキャッシュは 5 分保持なので、purge しないと切り替えたのに
  // まだ自分が載っている画面をしばらく見せてしまう。タグは全ユーザー共通で、
  // 切り替え自体は滅多に起きない操作のため、粒度を細かくはしない。
  purgeLeaderboardCache();

  return { success: true };
}
