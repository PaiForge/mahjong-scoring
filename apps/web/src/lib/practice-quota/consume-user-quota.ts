import { sql } from "drizzle-orm";
import "server-only";

import { practiceQuotaUsage } from "@/lib/db";
import { writeAsAccount } from "@/lib/users/account-write-lock";

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

  // 退会を受け付けた後には消費の行を作らない（消した行を作り直さない）
  const consumed = await writeAsAccount(userId, (tx) =>
    tx
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
      .returning({ count: practiceQuotaUsage.count }),
  );
  if (!consumed.written) return { allowed: false, remaining: 0 };

  const row = consumed.value[0];
  if (!row) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: Math.max(0, limit - row.count) };
}
