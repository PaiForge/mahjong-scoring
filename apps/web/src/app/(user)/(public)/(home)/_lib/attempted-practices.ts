import "server-only";

import { eq } from "drizzle-orm";

import { getOptionalUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  isPracticeMenuType,
  menuTypeToSlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import { challengeBestScores } from "@/lib/db/schema";

/**
 * 一度でも挑戦したことのある練習のスラッグ集合を返す。
 * 挑戦済み練習取得
 *
 * @remarks
 * `challenge_best_scores` は (userId, menuType, leaderboardKey) に 1 行なので、
 * 「その練習をやったことがあるか」は追記ログ（`challenge_results`）を走査せずに
 * ここから引ける。未認証の場合は空集合を返す。
 */
export async function fetchAttemptedPracticeSlugs(): Promise<
  ReadonlySet<PracticeMenuSlug>
> {
  const user = await getOptionalUser();
  if (!user) return new Set();

  const rows = await db
    .select({ menuType: challengeBestScores.menuType })
    .from(challengeBestScores)
    .where(eq(challengeBestScores.userId, user.id));

  const slugs = new Set<PracticeMenuSlug>();
  for (const row of rows) {
    // menu_type は varchar なので、レジストリから外れた過去の値は読み飛ばす
    if (!isPracticeMenuType(row.menuType)) continue;
    slugs.add(menuTypeToSlug(row.menuType));
  }
  return slugs;
}
