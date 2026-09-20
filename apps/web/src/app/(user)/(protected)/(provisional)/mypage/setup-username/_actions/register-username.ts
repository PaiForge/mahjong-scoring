"use server";

import type { ActionResult } from "@/lib/action-types";
import { db, profiles } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/extract-pg-error-code";
import { profileExistsByUserId } from "@/lib/db/queries";
import { authenticateAndCheckBan } from "@/lib/auth";
import type { AuthGateErrorCode } from "@/lib/auth";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
import { validateUsername } from "@/lib/username";
import type { UsernameValidationError } from "@/lib/username";
import { validateDisplayName } from "@/lib/validations/profile";

/**
 * ユーザー名登録 Server Action。
 * 初回ログイン後にプロフィールを作成する。
 *
 * ユーザー名登録アクション
 *
 * @param username - 希望するユーザー名（前後の空白は呼び出し側で除去済みでもよい）
 * @param displayName - 表示名。未指定なら username を流用する
 */
/** ユーザー名登録の失敗理由 */
export type RegisterUsernameError =
  | RateLimitErrorCode
  | AuthGateErrorCode
  | UsernameValidationError
  | "username_required"
  | "username_already_set"
  | "username_taken"
  | "display_name_too_long";

export async function registerUsername(
  username: string,
  displayName?: string,
): Promise<ActionResult<RegisterUsernameError>> {
  const rateLimited = await enforceIpRateLimit("username");
  if (rateLimited) {
    return rateLimited;
  }

  const authResult = await authenticateAndCheckBan();
  if ("error" in authResult) {
    return authResult;
  }
  const { user } = authResult;

  const trimmedUsername = username.trim();
  if (!trimmedUsername) {
    return { error: "username_required" };
  }

  const trimmedDisplayName = displayName?.trim() || trimmedUsername;

  const validationError = validateUsername(trimmedUsername);
  if (validationError) {
    return { error: validationError };
  }

  // 入力欄の maxLength はフォーム経由の入力しか止められない。表示名は
  // プロフィール編集と同じ行を書くので、上限も編集側と同じ規則で弾く。
  if (validateDisplayName(trimmedDisplayName)) {
    return { error: "display_name_too_long" };
  }

  // 二重作成を防ぐ（プロフィールが既にあるなら登録済み）
  if (await profileExistsByUserId(user.id)) {
    return { error: "username_already_set" };
  }

  // username の UNIQUE 制約が競合を最終的に弾く
  try {
    await db.insert(profiles).values({
      id: user.id,
      username: trimmedUsername,
      displayName: trimmedDisplayName,
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { error: "username_taken" };
    }
    throw e;
  }

  return { success: true };
}
