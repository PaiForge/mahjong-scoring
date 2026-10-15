"use server";

import { logActivityEvent } from "@/lib/activity-log";
import { getOptionalVerifiedUser } from "@/lib/auth";
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
  const user = await getOptionalVerifiedUser();
  if (user) {
    logActivityEvent({ userId: user.id, action: "logout" });
  }

  const supabase = await createClient();

  await supabase.auth.signOut();
}
