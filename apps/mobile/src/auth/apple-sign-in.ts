import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  CryptoDigestAlgorithm,
  digestStringAsync,
  randomUUID,
} from "expo-crypto";
import {
  MOBILE_APPLE_TOKEN_API_PATH,
  type MobileAppleTokenRequest,
} from "@mahjong-scoring/features/account/apple";

import { callMobileApi } from "./api-client";
import { supabase } from "./supabase-client";

/**
 * Apple でのログインの結果
 *
 * - `signedIn` — ログインした（初めての Apple ID なら、このときアカウントができる）
 * - `canceled` — 本人が Apple のシートを閉じた。何も伝えない
 * - `networkError` — 認証サーバーに届かなかった
 * - `failed` — それ以外の失敗
 */
export type AppleSignInResult =
  "signedIn" | "canceled" | "networkError" | "failed";

/**
 * この端末で Apple のネイティブのログインを出せるかを読む（iOS だけ）
 * Appleログイン可否フック
 *
 * Android と画面確認用の web 版では出さない（ネイティブの Apple ログインが無い）。
 */
export function useAppleSignInAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "ios" || !supabase) return;
    let active = true;
    void AppleAuthentication.isAvailableAsync().then((value) => {
      if (active) setAvailable(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return available;
}

/**
 * Apple のネイティブのログインでログイン（初めてなら登録）する
 * Appleログイン
 *
 * Apple の ID トークンを Supabase に渡してセッションを作る
 * （`signInWithIdToken`）。リプレイを防ぐ nonce は、Apple へはハッシュを、
 * Supabase へは元の値を渡す（Supabase が ID トークンの nonce と突き合わせる）。
 *
 * ログインできたら、Apple の認可コードをサーバーへ預ける
 * （{@link handOverAppleAuthorizationCode}）。退会のときに Apple 側の連携を
 * 取り消すために要る。預けるのを待たずにログインの結果を返す。
 *
 * 氏名は求めない。表示名は使っておらず、要らない情報を受け取らない。
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  if (!supabase) return "failed";
  const rawNonce = randomUUID();
  const hashedNonce = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
  } catch (error) {
    return isCanceled(error) ? "canceled" : "failed";
  }
  if (!credential.identityToken) return "failed";

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error || !data.user)
    return error?.status === undefined || error.status === 0
      ? "networkError"
      : "failed";

  if (credential.authorizationCode)
    void handOverAppleAuthorizationCode(
      data.user.id,
      credential.authorizationCode,
    );
  return "signedIn";
}

/** 本人が Apple のシートを閉じたときの失敗か */
function isCanceled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ERR_REQUEST_CANCELED"
  );
}

/** 認可コードを預け直す間隔。コードは Apple が 5 分で切るので、その内に収める */
const HAND_OVER_RETRY_DELAYS_MS = [2_000, 10_000, 30_000] as const;

/**
 * Apple の認可コードをサーバーへ預ける（届かなければ数回送り直す）
 * Apple認可コード受け渡し
 *
 * サーバーはコードを Apple と交換して refresh token を保存し、退会の
 * ときに Apple 側の連携を取り消す。コードは 1 度しか使えず 5 分で切れるので
 * 端末には残さない。届かないまま切れたら、次に Apple でログインしたときに
 * 預け直す（それまでに退会すると、Apple 側の連携だけが残る — 本人は
 * iPhone の設定の「Apple でサインイン」からいつでも解ける）。
 */
async function handOverAppleAuthorizationCode(
  userId: string,
  authorizationCode: string,
): Promise<void> {
  const body: MobileAppleTokenRequest = { authorizationCode };
  for (const delay of [0, ...HAND_OVER_RETRY_DELAYS_MS]) {
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    const response = await callMobileApi(MOBILE_APPLE_TOKEN_API_PATH, {
      method: "POST",
      body,
      asUser: userId,
    });
    if (!shouldRetry(response)) return;
  }
}

/** 送り直せば通るかもしれない失敗か（通信・一時的な障害・回数制限） */
function shouldRetry(response: Awaited<ReturnType<typeof callMobileApi>>) {
  if (typeof response === "string")
    return (
      response === "network" ||
      response === "authUnavailable" ||
      response === "rateLimited"
    );
  return response.status >= 500 || response.status === 429;
}
