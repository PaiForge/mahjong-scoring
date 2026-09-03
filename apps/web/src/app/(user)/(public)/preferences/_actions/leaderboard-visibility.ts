"use server";

import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { authenticateAndCheckBan, getOptionalUser } from "@/lib/auth";
import type { AuthGateErrorCode } from "@/lib/auth";
import { LEADERBOARD_CACHE_TAG } from "@/lib/cache-tags";
import { db, profiles } from "@/lib/db";
import { isHiddenFromLeaderboard } from "@/lib/db/leaderboard-visibility";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";

/** ランキング非表示設定の失敗理由 */
export type SetLeaderboardVisibilityError =
  RateLimitErrorCode | AuthGateErrorCode | "updateFailed";

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
  const rateLimited = await enforceIpRateLimit("updateLeaderboardVisibility");
  if (rateLimited) {
    return rateLimited;
  }

  const authResult = await authenticateAndCheckBan();
  if ("error" in authResult) {
    return authResult;
  }
  const { user } = authResult;

  try {
    await db
      .update(profiles)
      .set({ hiddenFromLeaderboard: hidden, updatedAt: new Date() })
      .where(eq(profiles.id, user.id));
  } catch {
    return { error: "updateFailed" };
  }

  // ランキングのキャッシュは 5 分保持なので、purge しないと切り替えたのに
  // まだ自分が載っている画面をしばらく見せてしまう。タグは全ユーザー共通で、
  // 切り替え自体は滅多に起きない操作のため、粒度を細かくはしない。
  revalidateTag(LEADERBOARD_CACHE_TAG, "default");

  return { success: true };
}
