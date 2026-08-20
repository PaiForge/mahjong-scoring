"use server";

import type { ActionResult } from "@/lib/action-types";
import { db, profiles } from "@/lib/db";
import { extractPgErrorCode } from "@/lib/db/extract-pg-error-code";
import { profileExistsByUserId } from "@/lib/db/queries";
import { getOptionalVerifiedUser } from "@/lib/auth";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import { validateUsername } from "@/lib/username";

const PG_UNIQUE_VIOLATION = "23505";

/**
 * ユーザー名登録 Server Action。
 * 初回ログイン後にプロフィールを作成する。
 *
 * ユーザー名登録アクション
 *
 * @param username - 希望するユーザー名（前後の空白は呼び出し側で除去済みでもよい）
 * @param displayName - 表示名。未指定なら username を流用する
 */
export async function registerUsername(
  username: string,
  displayName?: string,
): Promise<ActionResult> {
  const rateLimited = await enforceIpRateLimit("username");
  if (rateLimited) {
    return rateLimited;
  }

  const user = await getOptionalVerifiedUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  const trimmedUsername = username.trim();
  if (!trimmedUsername) {
    return { error: "username_required" };
  }

  const trimmedDisplayName = displayName?.trim() || trimmedUsername;

  const validationError = validateUsername(trimmedUsername);
  if (validationError) {
    return { error: validationError };
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
    if (extractPgErrorCode(e) === PG_UNIQUE_VIOLATION) {
      return { error: "username_taken" };
    }
    throw e;
  }

  return { success: true };
}
