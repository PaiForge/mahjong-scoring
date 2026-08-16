"use server";

import { logCurrentUserEvent } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

/**
 * サインアウト Server Action。
 * アクティビティログを記録してからサーバー側のセッションを破棄する。
 *
 * クライアント側の Supabase ローカルセッションは呼び出し元
 * （`AuthProvider.signOut`）が別途クリアする。
 *
 * サインアウトアクション
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();

  await logCurrentUserEvent(supabase, "logout");

  await supabase.auth.signOut();
}
