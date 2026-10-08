"use server";

import { eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { logActivityEvent } from "@/lib/activity-log";
import { purgeLeaderboardCache } from "@/lib/cache-tags";
import { profiles } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";
import { writeAsAccount } from "@/lib/users/account-write-lock";

import {
  type ProfileInput,
  type ProfileValidationError,
  normalizeAndValidateProfile,
} from "@/lib/validations/profile";

/** プロフィール更新の失敗理由 */
export type UpdateProfileError =
  UserActionGuardErrorCode | ProfileValidationError | "updateFailed";

export type UpdateProfileResult = ActionResult<UpdateProfileError>;

/**
 * プロフィール（表示名・自己紹介・SNS）の更新 Server Action。
 * アバター画像は別途 /api/profile/avatar で扱う。
 * プロフィール更新アクション
 */
export async function updateProfile(
  input: ProfileInput,
): Promise<UpdateProfileResult> {
  const guard = await guardUserAction("updateProfile");
  if ("error" in guard) {
    return guard;
  }
  const { user } = guard;

  const validated = normalizeAndValidateProfile(input);
  if (!validated.ok) {
    return { error: validated.error };
  }

  try {
    // 退会を受け付けた後には書かない（匿名化した名前を書き戻さない）
    const { written } = await writeAsAccount(user.id, (tx) =>
      tx
        .update(profiles)
        .set({ ...validated.value, updatedAt: new Date() })
        .where(eq(profiles.id, user.id)),
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
    userId: user.id,
    action: "update_profile",
    targetType: "user",
    targetId: user.id,
  });

  return { success: true };
}
