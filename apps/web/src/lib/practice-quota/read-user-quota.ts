import { and, eq } from "drizzle-orm";
import "server-only";

import { db, practiceQuotaUsage } from "@/lib/db";

import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";

/**
 * ログイン済みユーザーが今日始めた問題数を消費せずに読む
 * 練習回数読み取り
 *
 * `consumeUserQuota` の対。盤面を離れて戻ってきたとき、解答中の問題を
 * 引き継ぎながら残数と特典の表示だけを取り直すために使う。行が無ければ
 * まだ 1 問も生成していないので 0。残りの計算は `peekUsage` が持つ。
 *
 * DB の失敗はそのまま投げる。
 *
 * @param day - JST の日付キー（`jstDayKey`）
 * @returns 今日始めた問題数
 */
export async function readUserQuotaUsage(
  userId: string,
  menu: QuotaMenu,
  day: string,
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

  return rows[0]?.count ?? 0;
}
