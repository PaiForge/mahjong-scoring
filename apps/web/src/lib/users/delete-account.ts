import "server-only";

import { eq } from "drizzle-orm";

import {
  challengeBestScores,
  challengeResults,
  db,
  expEvents,
  learnChapterReads,
  profiles,
  userExp,
  userRoles,
} from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * アカウント退会処理。
 *
 * 方針:
 * - `auth.users` はソフトデリート（ログイン不可化）。`profiles`(RESTRICT) と
 *   `moderation_actions`(RESTRICT) が参照するため物理削除はできず、また username 保持・
 *   監査ログ保持の足場として残す。
 * - `profiles` は行を残し、個人情報を NULL 化して `deletedAt` を記録する
 *   （username は再利用防止のため保持）。
 * - 成績・経験値・学習履歴・ロールは物理削除する（ランキングからも消える）。
 * - `user_activity_log` / `moderation_actions` は監査のため保持する。
 * - アバター画像は Storage から削除する（ベストエフォート）。
 *
 * アカウント退会
 */
export async function deleteAccount(
  userId: string,
): Promise<{ success: true } | { error: string }> {
  const adminClient = createAdminClient();

  // 1. auth ユーザーをソフトデリート（ログイン不可化）。失敗時は以降を実行しない。
  const { error: authError } = await adminClient.auth.admin.deleteUser(
    userId,
    true,
  );
  if (authError) {
    return { error: "deleteFailed" };
  }

  // 2. 行動データを物理削除し、profiles は username を残して匿名化する（トランザクション）。
  await db.transaction(async (tx) => {
    await tx
      .delete(challengeBestScores)
      .where(eq(challengeBestScores.userId, userId));
    await tx
      .delete(challengeResults)
      .where(eq(challengeResults.userId, userId));
    await tx.delete(expEvents).where(eq(expEvents.userId, userId));
    await tx.delete(userExp).where(eq(userExp.userId, userId));
    await tx
      .delete(learnChapterReads)
      .where(eq(learnChapterReads.userId, userId));
    await tx.delete(userRoles).where(eq(userRoles.userId, userId));

    await tx
      .update(profiles)
      .set({
        displayName: null,
        avatarUrl: null,
        bio: null,
        xUsername: null,
        instagramUsername: null,
        youtubeHandle: null,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId));
  });

  // 3. アバター画像を Storage から削除（失敗しても退会は完了させる）。
  try {
    const { data: files } = await adminClient.storage
      .from("avatars")
      .list(userId);
    if (files?.length) {
      await adminClient.storage
        .from("avatars")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }
  } catch {
    // Storage 障害で退会をブロックしない。
  }

  return { success: true };
}
