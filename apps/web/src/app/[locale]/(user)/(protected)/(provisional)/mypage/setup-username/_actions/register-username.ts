"use server";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { registerUsernameForUser } from "@/lib/users/register-username";
import type { UsernameRegistrationError } from "@/lib/users/register-username";

/** ユーザー名登録の失敗理由 */
export type RegisterUsernameError =
  UserActionGuardErrorCode | UsernameRegistrationError;

/**
 * ユーザー名登録 Server Action。
 * 初回ログイン後にプロフィールを作成する。
 *
 * 登録の本体は `registerUsernameForUser()`（src/lib/users/register-username.ts）に
 * 集約している（アプリ向け API と共有）。ここでは認証とレート制限だけを担う。
 *
 * ユーザー名登録アクション
 *
 * @param username - 希望するユーザー名（前後の空白は呼び出し側で除去済みでもよい）
 * @param displayName - 表示名。未指定なら username を流用する
 */
export async function registerUsername(
  username: string,
  displayName?: string,
): Promise<ActionResult<RegisterUsernameError>> {
  const guard = await guardUserAction("username");
  if ("error" in guard) {
    return guard;
  }
  return registerUsernameForUser(guard.user.id, username, displayName);
}
