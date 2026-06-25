import { cache } from "react";

import { and, eq, isNull } from "drizzle-orm";

import { db, profiles } from "@/lib/db";

/**
 * ユーザーIDからプロフィールの基本情報を取得する（React cache でリクエスト内で重複排除）。
 * BAN チェック (`bannedAt`) とプロフィール取得 (`username`) を単一クエリに統合し、
 * `isUserBanned` と `getProfileByUserId` の両方がこの結果を共有する。
 *
 * プロフィール基本情報取得
 */
export const getProfileCoreByUserId = cache(async (userId: string) => {
  const [profile] = await db
    .select({ username: profiles.username, bannedAt: profiles.bannedAt })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile;
});

/**
 * ユーザーIDからプロフィールを取得する（React cache でリクエスト内で重複排除）。
 *
 * プロフィール取得
 */
export const getProfileByUserId = cache(async (userId: string) => {
  const core = await getProfileCoreByUserId(userId);
  if (!core) return undefined;
  return { username: core.username };
});

/**
 * マイページのプロフィールカード用に、表示名・ユーザー名・アバターを取得する。
 *
 * プロフィールカード取得
 */
export const getProfileCardByUserId = cache(async (userId: string) => {
  const [profile] = await db
    .select({
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile;
});

/**
 * 公開プロフィール（/u/[username]）用に、ユーザー名から公開情報を取得する。
 * 退会済み（deletedAt）・BAN（bannedAt）のユーザーは取得しない（= 404 扱い）。
 *
 * 公開プロフィール取得
 */
export const getPublicProfileByUsername = cache(async (username: string) => {
  const [profile] = await db
    .select({
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
      xUsername: profiles.xUsername,
      instagramUsername: profiles.instagramUsername,
      youtubeHandle: profiles.youtubeHandle,
    })
    .from(profiles)
    .where(
      and(
        eq(profiles.username, username),
        isNull(profiles.deletedAt),
        isNull(profiles.bannedAt),
      ),
    )
    .limit(1);
  return profile;
});

/**
 * プロフィール編集ページ用に、編集可能なフィールド一式を取得する。
 *
 * プロフィール編集用取得
 */
export const getProfileForEdit = cache(async (userId: string) => {
  const [profile] = await db
    .select({
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
      xUsername: profiles.xUsername,
      instagramUsername: profiles.instagramUsername,
      youtubeHandle: profiles.youtubeHandle,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile;
});

/**
 * ユーザーIDに対応するプロフィールが存在するか確認する。
 *
 * プロフィール存在チェック
 */
export async function profileExistsByUserId(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row !== undefined;
}
