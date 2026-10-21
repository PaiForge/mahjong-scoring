import type { JwtPayload, User } from "@supabase/supabase-js";

/**
 * 認証済みユーザーの最小情報。JWT クレームから取得する（id = sub クレーム）。
 * 認証済みユーザー情報
 */
export interface AuthUser {
  readonly id: string;
  readonly email?: string;
  /**
   * 最初にサインアップしたときのプロバイダ（`email` / `google` / `apple`）。
   * Supabase が JWT の `app_metadata.provider` に入れる値をそのまま持つ。
   * ログインプロバイダ
   */
  readonly provider?: string;
}

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
