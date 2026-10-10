import "server-only";

import { eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { logActivityEvent } from "@/lib/activity-log";
import { purgeLeaderboardCache } from "@/lib/cache-tags";
import { profiles } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";
import {
  type ProfileInput,
  type ProfileValidationError,
  normalizeAndValidateProfile,
} from "@mahjong-scoring/features/profile/validation";

import { writeAsAccount } from "./account-write-lock";

/**
 * プロフィール更新そのものの失敗理由（認証・回数制限は呼び出し側）
 *
 * `unauthorized` は入口の確認を通った後に退会が受け付けられたとき
 * （退会を受け付けたユーザーは未認証として扱う）。
 */
export type ProfileUpdateError =
  ProfileValidationError | "unauthorized" | "updateFailed";

/**
 * プロフィール（表示名・自己紹介・SNS）を更新する
 * プロフィール更新
 *
 * web の Server Action とアプリ向け API の両方から呼ぶ。認証と回数制限は
 * 呼び出し側が済ませ、検証済みのユーザー ID だけを渡すこと。アバター画像は
 * 別（/api/profile/avatar）。
 *
 * @param userId - 認証済みユーザーの ID
 */
export async function updateProfileForUser(
  userId: string,
  input: ProfileInput,
): Promise<ActionResult<ProfileUpdateError>> {
  const validated = normalizeAndValidateProfile(input);
  if (!validated.ok) {
    return { error: validated.error };
  }

  try {
    // 退会を受け付けた後には書かない（匿名化した名前を書き戻さない）
    const { written } = await writeAsAccount(userId, (tx) =>
      tx
        .update(profiles)
        .set({ ...validated.value, updatedAt: new Date() })
        .where(eq(profiles.id, userId)),
    );
    if (!written) return { error: "unauthorized" };
  } catch (error) {
    logExternalError("updateProfile", "failed to update profile", error);
    return { error: "updateFailed" };
  }

  // ランキングのキャッシュ（5 分）は行に表示名を含むため、ここで捨てないと
  // 一覧だけ古い名前を出し続ける。アバター更新（/api/profile/avatar）も同じ理由で
  // 同じタグを捨てる。
  purgeLeaderboardCache();

  logActivityEvent({
    userId,
    action: "update_profile",
    targetType: "user",
    targetId: userId,
  });

  return { success: true };
}
