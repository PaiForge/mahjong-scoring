import "server-only";

import { z } from "zod";

import { logExternalError } from "../log-error";

import { createAppleClientSecret } from "./client-secret";
import type { AppleServerConfig } from "./config";

const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const APPLE_REVOKE_URL = "https://appleid.apple.com/auth/revoke";
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * 認可コードの交換の結果
 *
 * - `rejected` — Apple がコードを受け付けなかった（期限切れ・使用済み・別のアプリのもの）
 * - `unavailable` — Apple に届かなかった・こちらの設定（鍵・チーム ID）が通らなかった
 */
export type AppleCodeExchange =
  | {
      readonly ok: true;
      readonly refreshToken: string;
      /** Apple のユーザー ID（ID トークンの sub） */
      readonly subject: string;
    }
  | { readonly ok: false; readonly reason: "rejected" | "unavailable" };

const tokenResponseSchema = z.object({
  refresh_token: z.string().min(1),
  id_token: z.string().min(1),
});

const idTokenPayloadSchema = z.object({ sub: z.string().min(1) });

const errorResponseSchema = z.object({ error: z.string() });

/**
 * アプリが Apple から受け取った認可コードを、Apple の refresh token に交換する
 * Apple認可コード交換
 *
 * コードは 5 分で切れ、1 度しか使えない。
 *
 * @design 応答の ID トークンの署名を検証しない
 * ID トークンは Apple の token エンドポイントから TLS で直接受け取ったもので、
 * 途中で差し替えられる経路が無い（OpenID Connect Core 3.1.3.7 の 6）。
 * 取り出す `sub` は、ログイン中のユーザーの Apple の連携と突き合わせるために使う。
 */
export async function exchangeAppleAuthorizationCode(
  config: AppleServerConfig,
  clientId: string,
  authorizationCode: string,
): Promise<AppleCodeExchange> {
  const response = await postToApple(APPLE_TOKEN_URL, config, clientId, {
    code: authorizationCode,
    grant_type: "authorization_code",
  });
  if (!response) return { ok: false, reason: "unavailable" };
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const error = errorResponseSchema.safeParse(body).data?.error;
    if (error === "invalid_grant") return { ok: false, reason: "rejected" };
    logExternalError(
      "exchangeAppleAuthorizationCode",
      `Apple が交換を拒否（${response.status} ${error ?? "unknown"}）`,
      undefined,
    );
    return { ok: false, reason: "unavailable" };
  }
  const tokens = tokenResponseSchema.safeParse(body);
  const subject = tokens.success
    ? readIdTokenSubject(tokens.data.id_token)
    : undefined;
  if (!tokens.success || !subject) {
    logExternalError(
      "exchangeAppleAuthorizationCode",
      "Apple の応答の形が違う",
      undefined,
    );
    return { ok: false, reason: "unavailable" };
  }
  return { ok: true, refreshToken: tokens.data.refresh_token, subject };
}

/**
 * Apple の refresh token を取り消す（Apple 側の連携を解く）
 * Apple連携取り消し
 *
 * 取り消せた・既に無効だった（Apple が `invalid_grant` を返した）ら終わり。
 * Apple に届かない・設定が通らないときは投げる（退会の工程が再試行する）。
 */
export async function revokeAppleRefreshToken(
  config: AppleServerConfig,
  clientId: string,
  refreshToken: string,
): Promise<void> {
  const response = await postToApple(APPLE_REVOKE_URL, config, clientId, {
    token: refreshToken,
    token_type_hint: "refresh_token",
  });
  if (!response) throw new Error("apple revoke: unreachable");
  if (response.ok) return;
  const body: unknown = await response.json().catch(() => undefined);
  const error = errorResponseSchema.safeParse(body).data?.error;
  if (error === "invalid_grant") return;
  throw new Error(`apple revoke: ${response.status} ${error ?? "unknown"}`);
}

/** Apple へフォームを送る。届かなければ undefined */
async function postToApple(
  url: string,
  config: AppleServerConfig,
  clientId: string,
  params: Readonly<Record<string, string>>,
): Promise<Response | undefined> {
  const clientSecret = createAppleClientSecret({
    teamId: config.teamId,
    keyId: config.keyId,
    privateKey: config.privateKey,
    clientId,
  });
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        ...params,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logExternalError("postToApple", `Apple に届かない（${url}）`, error);
    return undefined;
  }
}

/** ID トークン（JWT）の本体から sub を読む。形が違えば undefined */
function readIdTokenSubject(idToken: string): string | undefined {
  const payload = idToken.split(".")[1];
  if (!payload) return undefined;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return idTokenPayloadSchema.safeParse(parsed).data?.sub;
  } catch {
    return undefined;
  }
}
