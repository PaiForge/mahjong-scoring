import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isUserBanned } from "./ban";
import { createClient } from "./supabase/server";
import { getProfileByUserId } from "./db/queries";

/**
 * 認証済みユーザーを返す。未認証の場合はサインインページへリダイレクト。
 * 認証済みユーザー取得
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
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
 * 認証済みユーザーまたは undefined を返す。リダイレクトなし。
 * オプショナルユーザー取得
 */
export const getOptionalUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * 認証 + BAN チェックガード（Server Actions 用）。
 * 認証済みかつ BAN されていないユーザーを返す。
 * 認証+BANガード
 */
export async function authenticateAndCheckBan(): Promise<{ user: User } | { error: string }> {
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
