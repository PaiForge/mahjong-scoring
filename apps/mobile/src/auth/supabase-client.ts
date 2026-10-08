import { AppState } from "react-native";
import Constants from "expo-constants";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { sessionStorage } from "./session-storage";
import { resolveSupabaseConfig } from "./supabase-config";

const config = resolveSupabaseConfig({
  envUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  envKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  isDev: __DEV__,
  hostUri: Constants.expoConfig?.hostUri,
});

/**
 * アプリの Supabase クライアント（認証だけに使う）
 * Supabaseクライアント
 *
 * 接続先が決まらない（ストアのビルドで環境変数が無い）ときは undefined で、
 * アプリはログインを出さずにゲストとして動く。
 *
 * DB は直接読み書きしない。記録・採点・退会は web のアプリ向け API
 * （`/api/mobile/v1/*`）を、このクライアントのアクセストークンで呼ぶ
 * （`account-api.ts`）。
 *
 * 1 つのクライアントをアプリ全体で共有する。トークンの更新はこのクライアント
 * だけが行い、各 API が個別に更新しない（同時に更新すると、回転済みの
 * リフレッシュトークンで片方が失敗してログアウトする）。
 */
export const supabase: SupabaseClient | undefined = config
  ? createClient(config.url, config.publishableKey, {
      auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        // ログインの結果を URL で受け取る経路（OAuth）はまだ無い
        detectSessionInUrl: false,
      },
    })
  : undefined;

// トークンの自動更新はアプリが前面にあるときだけ回す。背景ではタイマーが
// 止まり、戻ったときにまとめて更新される（supabase-js の React Native の定石）。
// モジュールの読み込みで 1 度だけ登録する。
if (supabase) {
  const client = supabase;
  if (AppState.currentState === "active") client.auth.startAutoRefresh();
  AppState.addEventListener("change", (state) => {
    if (state === "active") client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  });
}
