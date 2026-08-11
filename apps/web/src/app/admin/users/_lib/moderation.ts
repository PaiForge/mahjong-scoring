import { moderationActions } from "../../../../lib/db";
import type { TransactionClient } from "@/lib/db";

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
