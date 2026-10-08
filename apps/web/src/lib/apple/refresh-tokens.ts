import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { APPLE_APP_BUNDLE_ID } from "@mahjong-scoring/features/account/apple";

import { accountDeletions, appleRefreshTokens, db } from "../db";
import { logExternalError } from "../log-error";
import { lockAccountForWrite } from "../users/account-write-lock";

import {
  exchangeAppleAuthorizationCode,
  revokeAppleRefreshToken,
} from "./apple-id-api";
import { readAppleServerConfig } from "./config";
import { hasAppleIdentity } from "./identity";
import { decryptToken, encryptToken } from "./token-cipher";

/**
 * 認可コードを預かった結果
 *
 * - `saved` — 交換して保存した
 * - `rejected` — Apple がコードを受け付けなかった、または交換の結果が
 *   このユーザーの Apple の連携と一致しない
 * - `unavailable` — Apple に届かない・サーバーに Apple の設定が無い
 */
export type AppleCodeStoreResult = "saved" | "rejected" | "unavailable";

/**
 * アプリが Apple から受け取った認可コードを Apple と交換し、refresh token を保存する
 * Apple認可コード保存
 *
 * 交換の結果の Apple のユーザー ID が `appleSubject`（ログイン中のユーザーに
 * つながった Apple の連携）と一致するときだけ保存する。別の Apple アカウントの
 * コードで他人のトークンを紐づける経路を作らない。
 *
 * @param appleSubject - 認証サーバーが返したこのユーザーの Apple の連携の ID
 */
export async function storeAppleAuthorizationCode(
  userId: string,
  appleSubject: string,
  authorizationCode: string,
): Promise<AppleCodeStoreResult> {
  const config = readAppleServerConfig();
  if (!config) {
    logExternalError(
      "storeAppleAuthorizationCode",
      "Apple の設定（APPLE_*）が無い",
      undefined,
    );
    return "unavailable";
  }
  const exchanged = await exchangeAppleAuthorizationCode(
    config,
    APPLE_APP_BUNDLE_ID,
    authorizationCode,
  );
  if (!exchanged.ok) return exchanged.reason;
  if (exchanged.subject !== appleSubject) return "rejected";
  await saveAppleRefreshToken(userId, {
    appleSubject,
    clientId: APPLE_APP_BUNDLE_ID,
    encryptedRefreshToken: encryptToken(
      exchanged.refreshToken,
      config.encryptionKey,
    ),
  });
  return "saved";
}

/**
 * 暗号化した refresh token を保存する（同じユーザーの古いものは置き換える）
 *
 * @design 退会の受付の後に届いたトークンも保存し、取り消しの工程を開き直す
 * Apple との交換を待っている間に退会を受け付け、取り消しの工程まで
 * 終わっていることがある。保存を断るだけでは、受け取ったトークンの
 * 連携が Apple に残る。退会の書き込みロック（`lockAccountForWrite`）を
 * 取って、退会を受け付けていたら、保存と同時に退会の要求の Apple の
 * 工程と完了を未了へ戻す。cron（`processPendingAccountDeletions`）が
 * 拾い直してこのトークンを取り消す。
 *
 * 取り消しの工程の「済み」の記録（{@link revokeAppleLinkForDeletion}）も
 * 同じ要求の行をロックして、トークンが残っていないことを確かめてから書く。
 * どちらが先に行のロックを取っても、保存したトークンが取り消されずに
 * 退会が完了することは無い。
 */
async function saveAppleRefreshToken(
  userId: string,
  values: {
    readonly appleSubject: string;
    readonly clientId: string;
    readonly encryptedRefreshToken: string;
  },
): Promise<void> {
  const row = { ...values, updatedAt: new Date() };
  await db.transaction(async (tx) => {
    const deleting = !(await lockAccountForWrite(tx, userId));
    if (deleting)
      await tx
        .select({ userId: accountDeletions.userId })
        .from(accountDeletions)
        .where(eq(accountDeletions.userId, userId))
        .for("update");
    await tx
      .insert(appleRefreshTokens)
      .values({ userId, ...row })
      .onConflictDoUpdate({ target: appleRefreshTokens.userId, set: row });
    if (deleting)
      await tx
        .update(accountDeletions)
        .set({ appleRevokedAt: null, completedAt: null })
        .where(eq(accountDeletions.userId, userId));
  });
}

/**
 * Apple の refresh token を保存しているか
 * Appleトークン保存確認
 */
export async function hasAppleRefreshToken(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ userId: appleRefreshTokens.userId })
    .from(appleRefreshTokens)
    .where(eq(appleRefreshTokens.userId, userId))
    .limit(1);
  return row !== undefined;
}

/**
 * 退会するユーザーの Apple の連携を取り消し、取り消しの工程を済みにする
 * Apple連携の後始末（退会）
 *
 * 保存したトークンを Apple に取り消させてから行を消し、トークンが残って
 * いないことを確かめて `account_deletions.apple_revoked_at` を入れる
 * （その間に新しいトークンが保存されていたら、もう 1 周する）。
 *
 * - Apple の連携が無ければ、取り消すものは無いので済みにする
 * - 連携があるのにトークンが無ければ投げる（取り消していないのに済みに
 *   しない）。アプリの退会はトークンが無いと Apple での確認を求めるので、
 *   ここへ来るのはそれを経ずに受け付けた退会だけ。`last_error` に残り、
 *   退会は完了にならない
 * - 復号できない（鍵を替えた）トークンは取り消せないので投げる
 * - 設定が無い・Apple に届かないときも投げる（退会の工程が再試行する）
 */
export async function revokeAppleLinkForDeletion(
  userId: string,
): Promise<void> {
  for (;;) {
    const [row] = await db
      .select()
      .from(appleRefreshTokens)
      .where(eq(appleRefreshTokens.userId, userId))
      .limit(1);
    if (row) {
      await revokeStoredToken(row.clientId, row.encryptedRefreshToken);
      // 取り消したものだけを消す（その間に置き換わった新しいトークンは残す）
      await db
        .delete(appleRefreshTokens)
        .where(
          and(
            eq(appleRefreshTokens.userId, userId),
            eq(
              appleRefreshTokens.encryptedRefreshToken,
              row.encryptedRefreshToken,
            ),
          ),
        );
    } else if (await hasAppleIdentity(userId)) {
      throw new Error("apple revoke: linked but no token");
    }
    if (await markAppleRevoked(userId)) return;
  }
}

/** 保存したトークンを復号して取り消す。できなければ投げる */
async function revokeStoredToken(
  clientId: string,
  encryptedRefreshToken: string,
): Promise<void> {
  const config = readAppleServerConfig();
  if (!config) throw new Error("apple revoke: not configured");
  const refreshToken = decryptToken(
    encryptedRefreshToken,
    config.encryptionKey,
  );
  if (refreshToken === undefined)
    throw new Error("apple revoke: cannot decrypt the stored token");
  await revokeAppleRefreshToken(config, clientId, refreshToken);
}

/**
 * トークンが残っていなければ取り消しの工程を済みにする。残っていれば false
 */
async function markAppleRevoked(userId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx
      .select({ userId: accountDeletions.userId })
      .from(accountDeletions)
      .where(eq(accountDeletions.userId, userId))
      .for("update");
    const [remaining] = await tx
      .select({ userId: appleRefreshTokens.userId })
      .from(appleRefreshTokens)
      .where(eq(appleRefreshTokens.userId, userId))
      .limit(1);
    if (remaining) return false;
    await tx
      .update(accountDeletions)
      .set({ appleRevokedAt: new Date() })
      .where(
        and(
          eq(accountDeletions.userId, userId),
          isNull(accountDeletions.appleRevokedAt),
        ),
      );
    return true;
  });
}
