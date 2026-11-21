"use server";

import type { ActionResult } from "@/lib/action-types";
import { logActivityEvent } from "@/lib/activity-log";
import { isAuthServiceFailure } from "@/lib/auth-service-failure";
import { logExternalError } from "@/lib/log-error";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";

/**
 * サインインの失敗理由
 *
 * アカウント列挙を防ぐため、認証失敗は理由を分けず `invalidCredentials` に畳む。
 *
 * `serviceUnavailable` だけは分ける。認証サーバーに届かない・障害（5xx）・
 * 回数制限（429）で、資格情報が正しいかどうかの答えではない
 * （`isAuthServiceFailure`）。これを「メールアドレスかパスワードが違う」と出すと、
 * 障害の間、正しいパスワードの人がパスワードの再設定へ向かう。どの失敗も
 * そのアカウントが在るかどうかに依らないので、列挙の手掛かりにはならない。
 */
export type SignInError =
  RateLimitErrorCode | "invalidCredentials" | "serviceUnavailable";

export type SignInResult = ActionResult<SignInError>;

/**
 * メールアドレス/パスワードによるサインイン Server Action。
 * アカウント列挙を防ぐため、認証失敗時は汎用エラーを返す。
 * メールサインイン
 */
export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const rateLimited = await enforceIpRateLimit("signIn");
  if (rateLimited) {
    return rateLimited;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // 認証サーバーが答えられなかった失敗は、資格情報の誤りと言わない
    if (isAuthServiceFailure(error)) {
      logExternalError("signIn", "the auth server could not answer", error);
      return { error: "serviceUnavailable" };
    }
    return { error: "invalidCredentials" };
  }

  logActivityEvent({ userId: data.user.id, action: "login" });

  return { success: true };
}
