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

/**
 * 管理者の操作の種類（`moderation_actions.action` の値）
 * モデレーション操作種別
 *
 * 監査ログの絞り込み（`audit-log/page.tsx`）の選択肢と同じ文字列。
 */
export const ModerationActionKind = {
  Ban: "ban",
  Unban: "unban",
  GrantBenefits: "grant_benefits",
  RevokeBenefits: "revoke_benefits",
} as const;
export type ModerationActionKind =
  (typeof ModerationActionKind)[keyof typeof ModerationActionKind];

/** モデレーション操作の記録内容 */
interface ModerationActionRecord {
  readonly actorId: string;
  readonly action: ModerationActionKind;
  readonly targetId: string;
  readonly reason?: string;
  readonly ipAddress: string | undefined;
  /** 操作の付随情報（付与した特典・期限など）。既定は空 */
  readonly metadata?: Record<string, unknown>;
}

/**
 * moderation_actions テーブルへ監査レコードを追加する。
 * モデレーション記録
 *
 * BAN / BAN 解除 / 特典の付与・取り消しで共通の INSERT を一元化する。
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
    metadata: record.metadata ?? {},
  });
}
