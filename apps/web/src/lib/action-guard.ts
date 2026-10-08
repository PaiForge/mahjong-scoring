import { authenticateAndCheckBan } from "./auth";
import type { AuthGateErrorCode, AuthUser } from "./auth";
import { enforceIpRateLimit } from "./rate-limit-ip";
import type { IP_RATE_LIMITS, RateLimitErrorCode } from "./rate-limit-ip";

/**
 * {@link guardUserAction} が返し得るエラーコード
 *
 * これを通すアクションは `ActionResult` の union にこの型を含める。
 */
export type UserActionGuardErrorCode = RateLimitErrorCode | AuthGateErrorCode;

/**
 * ログインを要求する Server Action の前処理（IP レートリミット → 認証 + BAN）
 * ユーザーアクションガード
 *
 * 超過・未認証・BAN のいずれかならエラーを返し、通過すればユーザーを返す。
 *
 * @param rateLimitKey - アクションキー（`IP_RATE_LIMITS` のキー）
 * @param options - 認証ゲートへの指定（{@link authenticateAndCheckBan}）
 */
export async function guardUserAction(
  rateLimitKey: keyof typeof IP_RATE_LIMITS,
  options?: Parameters<typeof authenticateAndCheckBan>[0],
): Promise<{ user: AuthUser } | { error: UserActionGuardErrorCode }> {
  const rateLimited = await enforceIpRateLimit(rateLimitKey);
  if (rateLimited) {
    return rateLimited;
  }
  return authenticateAndCheckBan(options);
}
