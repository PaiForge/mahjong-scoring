import type { JwtPayload, User } from "@supabase/supabase-js";

import type { AuthUser } from "./auth";

/**
 * JWT のクレームから {@link AuthUser} を組み立てる。
 * クレームからの認証ユーザー変換
 *
 * `getClaims()` でローカル検証した経路（`getAuthenticatedUser` / `getOptionalUser`）が使う。
 */
export function claimsToAuthUser(
  claims: Pick<JwtPayload, "sub" | "email" | "app_metadata">,
): AuthUser {
  return {
    id: claims.sub,
    email: claims.email,
    provider: claims.app_metadata?.provider,
  };
}

/**
 * 認証サーバーが返した `User` から {@link AuthUser} を組み立てる。
 * Supabase ユーザーからの認証ユーザー変換
 *
 * `getUser()` で問い合わせた経路（`getOptionalVerifiedUser`・アプリ向け API の Bearer 検証）が使う。
 */
export function userToAuthUser(
  user: Pick<User, "id" | "email" | "app_metadata">,
): AuthUser {
  return {
    id: user.id,
    email: user.email,
    provider: user.app_metadata.provider,
  };
}
