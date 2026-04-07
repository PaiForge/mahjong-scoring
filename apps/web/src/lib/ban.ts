import { eq } from 'drizzle-orm';
import 'server-only';

import { db, profiles } from './db';

/**
 * ユーザーが BAN されているかチェックする。
 * profiles.bannedAt が non-null の場合に true を返す。
 * BAN チェック
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  const [profile] = await db
    .select({ bannedAt: profiles.bannedAt })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile?.bannedAt != null;
}
