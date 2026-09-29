import { moderationActions } from "../../../../lib/db";
import type { TransactionClient } from "@/lib/db";

/**
 * Supabase Auth の `ban_duration` に渡す値
 * BAN期間
 *
 * Auth に「無期限」の指定は無いため、100 年（876000h）を永久 BAN として扱う。
 * BAN と BAN 解除はそれぞれ失敗時に相手側の値でロールバックするので、
 * 4 箇所が同じ値を使うようここに置く。
 */
export const PERMANENT_BAN_DURATION = "876000h";
export const NO_BAN_DURATION = "none";

/** モデレーション操作の記録内容 */
interface ModerationActionRecord {
  readonly actorId: string;
  readonly action: "ban" | "unban";
  readonly targetId: string;
  readonly reason?: string;
  readonly ipAddress: string | undefined;
}

/**
 * moderation_actions テーブルへ監査レコードを追加する。
 * モデレーション記録
 *
 * BAN / BAN 解除の両アクションで共通の INSERT を一元化する。
 */
export async function recordModerationAction(
  tx: TransactionClient,
  record: ModerationActionRecord,
): Promise<void> {
  await tx.insert(moderationActions).values({
    actorId: record.actorId,
    action: record.action,
    targetType: "user",
    targetId: record.targetId,
    reason: record.reason,
    ipAddress: record.ipAddress,
    metadata: {},
  });
}
