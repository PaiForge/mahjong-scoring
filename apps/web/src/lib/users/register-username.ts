import "server-only";

import type { ActionResult } from "@/lib/action-types";
import { db, profiles } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/extract-pg-error-code";
import { profileExistsByUserId } from "@/lib/db/queries";
import { validateUsername } from "@/lib/username";
import type { UsernameValidationError } from "@/lib/username";
import { validateDisplayName } from "@/lib/validations/profile";

/** ユーザー名登録そのものの失敗理由（認証・回数制限は呼び出し側） */
export type UsernameRegistrationError =
  | UsernameValidationError
  | "username_required"
  | "username_already_set"
  | "username_taken"
  | "display_name_too_long";

/**
 * ユーザー名を決めてプロフィールを作る（本登録）
 * ユーザー名登録
 *
 * web の Server Action とアプリ向け API の両方から呼ぶ。認証と回数制限は
 * 呼び出し側が済ませ、検証済みのユーザー ID だけを渡すこと。
 *
 * @param userId - 認証済みユーザーの ID
 * @param username - 希望するユーザー名（前後の空白は除いて扱う）
 * @param displayName - 表示名。未指定・空なら username を流用する
 */
export async function registerUsernameForUser(
  userId: string,
  username: string,
  displayName?: string,
): Promise<ActionResult<UsernameRegistrationError>> {
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
  if (await profileExistsByUserId(userId)) {
    return { error: "username_already_set" };
  }

  // username の UNIQUE 制約が競合を最終的に弾く
  try {
    await db.insert(profiles).values({
      id: userId,
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
