import "server-only";

import { eq } from "drizzle-orm";

import { appleRefreshTokens, db } from "../db";
import { logExternalError } from "../log-error";

import { revokeAppleRefreshToken } from "./apple-id-api";
import { readAppleServerConfig } from "./config";
import { decryptToken, encryptToken } from "./token-cipher";

/**
 * Apple の refresh token を暗号化して保存する（同じユーザーの古いものは置き換える）
 * Appleトークン保存
 *
 * 呼ぶ側は、交換の結果の Apple のユーザー ID がログイン中のユーザーの
 * Apple の連携と一致することを確かめてから呼ぶ。
 */
export async function saveAppleRefreshToken(
  userId: string,
  {
    appleSubject,
    clientId,
    refreshToken,
    encryptionKey,
  }: {
    readonly appleSubject: string;
    readonly clientId: string;
    readonly refreshToken: string;
    readonly encryptionKey: Buffer;
  },
): Promise<void> {
  const values = {
    appleSubject,
    clientId,
    encryptedRefreshToken: encryptToken(refreshToken, encryptionKey),
    updatedAt: new Date(),
  };
  await db
    .insert(appleRefreshTokens)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: appleRefreshTokens.userId, set: values });
}

/**
 * 退会するユーザーの Apple の連携を取り消し、保存したトークンを消す
 * Apple連携の後始末（退会）
 *
 * トークンが無ければ何もしない（Apple で登録していない・交換に失敗した）。
 * 設定が無い・Apple に届かないときは投げる（退会の工程が再試行する）。
 * 復号できない（鍵を替えた）トークンは取り消せないので、消して進める。
 */
export async function revokeAppleTokensForDeletion(
  userId: string,
): Promise<void> {
  const [row] = await db
    .select()
    .from(appleRefreshTokens)
    .where(eq(appleRefreshTokens.userId, userId))
    .limit(1);
  if (!row) return;
  const config = readAppleServerConfig();
  if (!config) throw new Error("apple revoke: not configured");
  const refreshToken = decryptToken(
    row.encryptedRefreshToken,
    config.encryptionKey,
  );
  if (refreshToken === undefined)
    logExternalError(
      "revokeAppleTokensForDeletion",
      "トークンを復号できない。取り消さずに消す",
      undefined,
    );
  else await revokeAppleRefreshToken(config, row.clientId, refreshToken);
  await db
    .delete(appleRefreshTokens)
    .where(eq(appleRefreshTokens.userId, userId));
}
