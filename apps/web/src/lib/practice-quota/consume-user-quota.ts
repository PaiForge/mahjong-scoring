import { sql } from "drizzle-orm";
import "server-only";

import { db, practiceQuotaUsage } from "@/lib/db";

import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";

/** 消費の結果。`allowed: false` のときは何も増やしていない */
export type ConsumeQuotaResult =
  | { readonly allowed: true; readonly remaining: number }
  | { readonly allowed: false; readonly remaining: 0 };

/**
 * ログイン済みユーザーの無料枠を 1 つ消費する
 * 練習回数消費
 *
 * `INSERT ... ON CONFLICT DO UPDATE SET count = count + 1 WHERE count < 上限
 * RETURNING count` の 1 文で「増やす」と「上限で弾く」を同時に行う。行が返らなければ
 * 上限到達（WHERE で UPDATE が起きなかった）。SELECT してから UPDATE する 2 手に
 * すると、並行したリクエストが両方「まだ余裕がある」と読んで上限を超える。
 *
 * DB の失敗はそのまま投げる。許可して通すか止めるかは呼び出し側
 * （Server Action）が決める。
 *
 * @param day - JST の日付キー（`jstDayKey`）
 * @param limit - 1 日の上限。0 以下なら消費せず不許可
 */
export async function consumeUserQuota(
  userId: string,
  menu: QuotaMenu,
  day: string,
  limit: number,
): Promise<ConsumeQuotaResult> {
  if (limit <= 0) return { allowed: false, remaining: 0 };

  const rows = await db
    .insert(practiceQuotaUsage)
    .values({ userId, menu, day, count: 1 })
    .onConflictDoUpdate({
      target: [
        practiceQuotaUsage.userId,
        practiceQuotaUsage.menu,
        practiceQuotaUsage.day,
      ],
      set: { count: sql`${practiceQuotaUsage.count} + 1` },
      setWhere: sql`${practiceQuotaUsage.count} < ${limit}`,
    })
    .returning({ count: practiceQuotaUsage.count });

  const row = rows[0];
  if (!row) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: Math.max(0, limit - row.count) };
}
