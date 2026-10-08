import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** 暗号文の形式の版。鍵や方式を替えたら上げ、古い版も読めるようにする */
const FORMAT_VERSION = "v1";
const IV_BYTES = 12;

/**
 * Apple の refresh token を暗号化する（AES-256-GCM）
 * トークン暗号化
 *
 * 形式は `v1.<iv>.<認証タグ>.<暗号文>`（どれも base64url）。
 */
export function encryptToken(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return [
    FORMAT_VERSION,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

/**
 * {@link encryptToken} の暗号文を戻す。鍵が違う・改ざんされている・形式が
 * 違えば undefined
 * トークン復号
 */
export function decryptToken(
  ciphertext: string,
  key: Buffer,
): string | undefined {
  const [version, iv, tag, encrypted] = ciphertext.split(".");
  if (version !== FORMAT_VERSION || !iv || !tag || encrypted === undefined)
    return undefined;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return undefined;
  }
}
