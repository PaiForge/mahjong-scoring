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
 * 利用者を対象にした管理者の操作の種類（`moderation_actions.action` の値）
 * モデレーション操作種別
 *
 * 監査ログの絞り込み（`audit-log/page.tsx`）の選択肢と同じ文字列。広告・
 * お知らせ・トラッキング ID への操作は `admin/_lib/content-action.ts` の
 * `ContentActionKind`（同じ表に積む）。
 */
export const ModerationActionKind = {
  Ban: "ban",
  Unban: "unban",
  GrantBenefits: "grant_benefits",
  RevokeBenefits: "revoke_benefits",
  /** 通報を受けてプロフィールの内容（表示名・自己紹介・アバター・SNS）を消した */
  ClearProfile: "clear_profile",
  /** 通報を対応済みにした（BAN・プロフィールの削除と同時に記録する） */
  ResolveReport: "resolve_report",
  /** 通報を対応不要として閉じた */
  DismissReport: "dismiss_report",
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
 * 利用者を対象にした操作を監査ログ（`moderation_actions`）に残す
 * モデレーション記録
 *
 * BAN / BAN 解除 / 通報への対応 / 特典の付与・取り消しで共通の INSERT を
 * 一元化する。対象は `target_id`（auth.users）で、`target_key` は持たない。
 * 利用者以外が対象の操作は `recordContentAction`（`admin/_lib/content-action.ts`）。
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
