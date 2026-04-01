import { cache } from 'react';

import { eq } from 'drizzle-orm';

import { db, profiles } from '@/lib/db';

/**
 * ユーザーIDからプロフィールを取得する（React cache でリクエスト内で重複排除）。
 *
 * プロフィール取得
 */
export const getProfileByUserId = cache(async (userId: string) => {
  const [profile] = await db
    .select({ username: profiles.username })
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
