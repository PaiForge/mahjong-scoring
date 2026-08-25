import "server-only";

import { eq } from "drizzle-orm";

import type { RankSlug } from "@/lib/ranks/registry";
import { isRankSlug } from "@/lib/ranks/registry";
import { db } from "./index";
import { userRanks } from "./schema";

/**
 * ユーザーの達成済み段級位スラッグを取得する
 * 達成済み段級位取得
 *
 * レジストリから削除された過去のランクが DB に残っている可能性があるため、
 * `isRankSlug` で現行レジストリに存在するものだけに絞る。
 */
export async function getUserRankSlugs(
  userId: string,
): Promise<readonly RankSlug[]> {
  const rows = await db
    .select({ rankSlug: userRanks.rankSlug })
    .from(userRanks)
    .where(eq(userRanks.userId, userId));

  return rows.map((row) => row.rankSlug).filter(isRankSlug);
}
