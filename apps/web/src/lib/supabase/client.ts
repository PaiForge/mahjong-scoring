import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ用 Supabase クライアントを生成する。
 * 環境変数が未設定の場合は `undefined` を返す。
 * ブラウザ用Supabaseクライアント生成
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase client not created: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"
    );
    return undefined;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
