import { cache } from 'react';

import { eq } from 'drizzle-orm';

import { db, profiles } from '@/lib/db';

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
