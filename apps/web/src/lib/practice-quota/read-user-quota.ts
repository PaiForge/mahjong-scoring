import { and, eq } from "drizzle-orm";
import "server-only";

import { db, practiceQuotaUsage } from "@/lib/db";

import type { QuotaMenu } from "./limits";

/**
 * ログイン済みユーザーの今日の残りを消費せずに読む
 * 練習回数読み取り
 *
 * `consumeUserQuota` の対。盤面を離れて戻ってきたとき、解答中の問題を
 * 引き継ぎながら残数と特典の表示だけを取り直すために使う。行が無ければ
 * まだ 1 問も生成していないので残りは上限そのもの。
 *
 * DB の失敗はそのまま投げる。
 *
 * @param day - JST の日付キー（`jstDayKey`）
 * @param limit - 1 日の上限
 * @returns 今日の残り（0 以上）
 */
export async function readUserQuota(
  userId: string,
  menu: QuotaMenu,
  day: string,
  limit: number,
): Promise<number> {
  const rows = await db
    .select({ count: practiceQuotaUsage.count })
    .from(practiceQuotaUsage)
    .where(
      and(
        eq(practiceQuotaUsage.userId, userId),
        eq(practiceQuotaUsage.menu, menu),
        eq(practiceQuotaUsage.day, day),
      ),
    )
    .limit(1);

  const used = rows[0]?.count ?? 0;
  return Math.max(0, limit - used);
}
