import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

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
