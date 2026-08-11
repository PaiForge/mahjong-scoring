import { createClient } from "@supabase/supabase-js";
import "server-only";

import { getSupabaseAdminEnv } from "./env";

/**
 * Supabase Admin クライアント（サービスロールキー使用）
 *
 * 管理者向けAPIアクセスにのみ使用する。
 */
export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
