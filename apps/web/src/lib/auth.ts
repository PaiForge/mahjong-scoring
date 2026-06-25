import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isUserBanned } from "./ban";
import { createClient } from "./supabase/server";
import { getProfileByUserId } from "./db/queries";

/**
 * 認証済みユーザーの最小情報。JWT クレームから取得する（id = sub クレーム）。
 * 認証済みユーザー情報
 */
export interface AuthUser {
  readonly id: string;
  readonly email?: string;
}

/**
 * 認証済みユーザーを返す。未認証の場合はサインインページへリダイレクト。
 *
 * getClaims() は非対称署名キー構成では JWT をローカル検証するため、
 * getUser() のような認証サーバーへのネットワーク往復が不要になり、
 * 保護ページ遷移ごとの認証待ちを短縮できる（対称鍵時は getUser に
 * フォールバックし従来同等）。cache() によりリクエスト内では1回だけ評価される。
 * 認証済みユーザー取得
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthUser> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) {
    redirect("/sign-in");
  }
  return { id: claims.sub, email: claims.email };
});

/**
 * 認証済みユーザーとプロフィールを返す。未認証の場合はサインインページへリダイレクト。
 * 認証済みユーザー+プロフィール取得
 */
export const getAuthenticatedProfile = cache(async () => {
  const user = await getAuthenticatedUser();
  const profile = await getProfileByUserId(user.id);
  return { user, profile };
});

/**
 * 本登録済み（プロフィール作成済み）ユーザーを要求するページガード。
 * 未認証 → /sign-in、BAN → /banned、プロフィール未作成 → /mypage/setup-username。
 *
 * 認証ガードを (confirmed) レイアウトではなく各ページで呼ぶことで、認証待ちを
 * ページ自身の loading.tsx 境界内に収め、リロード時もページ個別スケルトンを表示する。
 * 本登録ユーザーガード
 */
export const requireConfirmedUser = cache(async () => {
  const { user, profile } = await getAuthenticatedProfile();

  if (await isUserBanned(user.id)) {
    redirect("/banned");
  }
  if (!profile) {
    redirect("/mypage/setup-username");
  }

  return { user, profile };
});

/**
 * 仮登録（プロフィール未作成）ユーザーを要求するページガード。
 * 未認証 → /sign-in、BAN → /banned、プロフィール作成済み → /mypage。
 *
 * 認証ガードを (provisional) レイアウトではなく各ページで呼ぶための関数。
 * 仮登録ユーザーガード
 */
export const requireProvisionalUser = cache(async () => {
  const { user, profile } = await getAuthenticatedProfile();

  if (await isUserBanned(user.id)) {
    redirect("/banned");
  }
  if (profile) {
    redirect("/mypage");
  }

  return { user };
});

/**
 * 認証済みユーザーまたは null を返す。リダイレクトなし。
 * getClaims() でローカル検証する（getAuthenticatedUser と同様）。
 * オプショナルユーザー取得
 */
export const getOptionalUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return claims ? { id: claims.sub, email: claims.email } : null;
});

/**
 * 認証 + BAN チェックガード（Server Actions 用）。
 * 認証済みかつ BAN されていないユーザーを返す。
 * 認証+BANガード
 */
export async function authenticateAndCheckBan(): Promise<
  { user: User } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "signInRequired" };
  }

  if (await isUserBanned(user.id)) {
    return { error: "banned" };
  }

  return { user };
}
