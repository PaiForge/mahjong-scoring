"use server";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import {
  type ProfileUpdateError,
  updateProfileForUser,
} from "@/lib/users/update-profile";
import type { ProfileInput } from "@mahjong-scoring/features/profile/validation";

/** プロフィール更新の失敗理由 */
export type UpdateProfileError = UserActionGuardErrorCode | ProfileUpdateError;

export type UpdateProfileResult = ActionResult<UpdateProfileError>;

/**
 * プロフィール（表示名・自己紹介・SNS）の更新 Server Action。
 * アバター画像は別途 /api/profile/avatar で扱う。本体はアプリ向け API と
 * 共有する `updateProfileForUser`。
 * プロフィール更新アクション
 */
export async function updateProfile(
  input: ProfileInput,
): Promise<UpdateProfileResult> {
  const guard = await guardUserAction("updateProfile");
  if ("error" in guard) {
    return guard;
  }
  return updateProfileForUser(guard.user.id, input);
}
