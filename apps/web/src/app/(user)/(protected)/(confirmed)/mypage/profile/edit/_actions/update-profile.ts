"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import type { ActionResult } from "@/lib/action-types";
import { logActivityEvent } from "@/lib/activity-log";
import { authenticateAndCheckBan } from "@/lib/auth";
import type { AuthGateErrorCode } from "@/lib/auth";
import { LEADERBOARD_CACHE_TAG } from "@/lib/cache-tags";
import { db, profiles } from "@/lib/db";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";

import {
  type ProfileInput,
  type ProfileValidationError,
  normalizeAndValidateProfile,
} from "../_lib/profile-validation";

/** プロフィール更新の失敗理由 */
export type UpdateProfileError =
  | RateLimitErrorCode
  | AuthGateErrorCode
  | ProfileValidationError
  | "updateFailed";

export type UpdateProfileResult = ActionResult<UpdateProfileError>;

/**
 * プロフィール（表示名・自己紹介・SNS）の更新 Server Action。
 * アバター画像は別途 /api/profile/avatar で扱う。
 * プロフィール更新アクション
 */
export async function updateProfile(
  input: ProfileInput,
): Promise<UpdateProfileResult> {
  const rateLimited = await enforceIpRateLimit("updateProfile");
  if (rateLimited) {
    return rateLimited;
  }

  const authResult = await authenticateAndCheckBan();
  if ("error" in authResult) {
    return authResult;
  }
  const { user } = authResult;

  const validated = normalizeAndValidateProfile(input);
  if (!validated.ok) {
    return { error: validated.error };
  }

  try {
    await db
      .update(profiles)
      .set({ ...validated.value, updatedAt: new Date() })
      .where(eq(profiles.id, user.id));
  } catch {
    return { error: "updateFailed" };
  }

  // ランキングのキャッシュ（5 分）は行に表示名を含むため、ここで捨てないと
  // 一覧だけ古い名前を出し続ける。アバター更新（/api/profile/avatar）も同じ理由で
  // 同じタグを捨てる。
  revalidateTag(LEADERBOARD_CACHE_TAG, "default");

  logActivityEvent({
    userId: user.id,
    action: "update_profile",
    targetType: "user",
    targetId: user.id,
  });

  return { success: true };
}
