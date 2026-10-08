import "server-only";

import { createPrivateKey, sign } from "node:crypto";

/** Apple が受け付ける client secret の寿命の上限は 6 か月。サーバーは使うたびに作るので短くてよい */
const CLIENT_SECRET_TTL_SECONDS = 5 * 60;

/**
 * Apple の token / revoke エンドポイントに渡す client secret を作る
 * Apple client secret 生成
 *
 * Sign in with Apple の鍵（.p8）で ES256 署名した JWT。`iss` はチーム ID、
 * `sub` は client_id（アプリの Bundle ID）、`aud` は Apple。
 *
 * サーバーは呼ぶたびに作り直すので、6 か月ごとの更新は要らない（6 か月の
 * 更新が要るのは、web の Apple ログインのために Supabase のダッシュボードへ
 * 貼る client secret だけ）。
 */
export function createAppleClientSecret({
  teamId,
  keyId,
  privateKey,
  clientId,
  now = Date.now(),
}: {
  readonly teamId: string;
  readonly keyId: string;
  readonly privateKey: string;
  readonly clientId: string;
  readonly now?: number;
}): string {
  const issuedAt = Math.floor(now / 1000);
  const header = { alg: "ES256", kid: keyId };
  const payload = {
    iss: teamId,
    iat: issuedAt,
    exp: issuedAt + CLIENT_SECRET_TTL_SECONDS,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  // JWS の ES256 は DER ではなく r || s の 64 バイト（RFC 7518 3.4）
  const signature = sign("sha256", Buffer.from(signingInput), {
    key: createPrivateKey(privateKey),
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${signature.toString("base64url")}`;
}

function base64UrlJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
