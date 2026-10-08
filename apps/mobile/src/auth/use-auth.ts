import { create } from "zustand";
import type { MobileMeResponse } from "@mahjong-scoring/features/account/mobile-api";

import { fetchAccount, type ApiFailure } from "./account-api";
import { supabase } from "./supabase-client";

/**
 * ログインの状態
 *
 * - `unavailable` — 接続先が無いビルド。ログインを出さない
 * - `loading` — 保存したセッションを読んでいる
 * - `signedOut` — ゲスト
 * - `signedIn` — ログイン中（ユーザー名を決めたかは `account` が持つ）
 */
export type AuthStatus = "unavailable" | "loading" | "signedOut" | "signedIn";

interface AuthState {
  readonly status: AuthStatus;
  /** ログイン中のユーザー。ゲストなら undefined */
  readonly user: { readonly id: string; readonly email?: string } | undefined;
  /**
   * サーバーから読んだアカウント状態。読み終えるまで・読めなかったときは
   * undefined（`accountError` で区別する）
   */
  readonly account: MobileMeResponse | undefined;
  /**
   * アカウント状態を読めなかった理由。`banned` は BAN 中（ログアウトと
   * 退会はできる）、それ以外は通信の失敗などで読み直せる
   */
  readonly accountError: ApiFailure | undefined;
}

const useAuthStore = create<AuthState>(() => ({
  status: supabase ? "loading" : "unavailable",
  user: undefined,
  account: undefined,
  accountError: undefined,
}));

/**
 * アカウント状態をサーバーから読み直す
 * アカウント状態再取得
 *
 * ログイン直後・ユーザー名を決めた後に呼ぶ。401 なら `callMobileApi` が
 * ログイン状態を捨て、ここへはゲストとして戻ってくる。
 */
export async function refreshAccount(): Promise<MobileMeResponse | undefined> {
  const userId = useAuthStore.getState().user?.id;
  if (userId === undefined) return undefined;
  useAuthStore.setState({ accountError: undefined });
  const result = await fetchAccount();
  // 読んでいる間に別のユーザーへ切り替わったら、古い結果を捨てる
  if (useAuthStore.getState().user?.id !== userId) return undefined;
  if ("error" in result) {
    useAuthStore.setState({ account: undefined, accountError: result.error });
    return undefined;
  }
  useAuthStore.setState({ account: result, accountError: undefined });
  return result;
}

/**
 * ログアウトする（この端末のログイン状態を捨てる）
 * ログアウト
 *
 * 他の端末のログインは残す（`scope: "local"`）。web の「ログアウト」も
 * そのブラウザだけを抜ける。
 */
export async function signOut(): Promise<void> {
  await supabase?.auth.signOut({ scope: "local" });
}

// セッションの変化を 1 か所で受けてストアに写す。モジュールの読み込みで
// 1 度だけ登録し、起動時に保存済みのセッションが INITIAL_SESSION で届く。
supabase?.auth.onAuthStateChange((event, session) => {
  const user = session?.user;
  if (!user) {
    useAuthStore.setState({
      status: "signedOut",
      user: undefined,
      account: undefined,
      accountError: undefined,
    });
    return;
  }
  const changed = useAuthStore.getState().user?.id !== user.id;
  useAuthStore.setState({
    status: "signedIn",
    user: { id: user.id, email: user.email },
    ...(changed ? { account: undefined, accountError: undefined } : {}),
  });
  // トークンの更新だけなら読み直さない。コールバックの中で Supabase の
  // 呼び出しを待つと supabase-js の内部のロックと絡んで止まるため、次の
  // ターンに回す（supabase-js の注意書き）
  if (changed || event === "SIGNED_IN" || event === "USER_UPDATED") {
    setTimeout(() => void refreshAccount(), 0);
  }
});

/**
 * ログインの状態を読む
 * 認証状態フック
 */
export function useAuth(): AuthState {
  return useAuthStore();
}
