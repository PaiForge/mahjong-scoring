"use server";

import { eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { logActivityEvent } from "@/lib/activity-log";
import { authenticateAndCheckBan } from "@/lib/auth";
import { db, profiles } from "@/lib/db";
import { IP_RATE_LIMITS, enforceIpRateLimit } from "@/lib/rate-limit-ip";

import {
  type ProfileInput,
  normalizeAndValidateProfile,
} from "../_lib/profile-validation";

export type UpdateProfileResult = ActionResult;

/**
 * プロフィール（表示名・自己紹介・SNS）の更新 Server Action。
 * アバター画像は別途 /api/profile/avatar で扱う。
 * プロフィール更新アクション
 */
export async function updateProfile(
  input: ProfileInput,
): Promise<UpdateProfileResult> {
  const rateLimited = await enforceIpRateLimit(
    "updateProfile",
    IP_RATE_LIMITS.updateProfile,
  );
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

  logActivityEvent({
    userId: user.id,
    action: "update_profile",
    targetType: "user",
    targetId: user.id,
  });

  return { success: true };
}
