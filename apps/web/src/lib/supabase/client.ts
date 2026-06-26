import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "./env";

/**
 * ブラウザ用 Supabase クライアントを生成する。
 * 環境変数が未設定の場合は例外をスローする。
 * ブラウザ用Supabaseクライアント生成
 */
export function createClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  return createBrowserClient(url, publishableKey);
}
