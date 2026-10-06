import { and, desc, eq, isNull } from "drizzle-orm";
import "server-only";

import {
  addPassDuration,
  PLANS,
  type PlanKey,
} from "@mahjong-scoring/features/billing/plans";
import {
  benefitGrants,
  db,
  type BenefitGrant,
  type TransactionClient,
} from "@/lib/db";
import { logExternalError } from "@/lib/log-error";

/**
 * 特典の手動付与の記録と参照
 * 特典付与記録
 *
 * 付与と取り消しは管理画面の Server Action がトランザクションの中で呼び、
 * 同じトランザクションで `moderation_actions` にも残す（BAN と同じ立て付け）。
 * ここは行の読み書きだけを持ち、認可と監査は呼び出し側の責務。
 *
 * 特典の判定（`has-benefit.ts`）はこのモジュールを通らず表を直接読む。
 * 判定の規則を 1 か所（判定側）に置くため。
 */

/** 付与の内容 */
export interface BenefitGrantInput {
  readonly userId: string;
  readonly plan: PlanKey;
  /** 付与の理由。空にしない（DB の CHECK でも弾く） */
  readonly reason: string;
  /** 付与した管理者 */
  readonly grantedBy: string;
  /** 有効日数。undefined なら無期限 */
  readonly durationDays: number | undefined;
}

/**
 * 特典を付与する（トランザクション内で呼ぶ）
 * 特典付与
 *
 * `benefits` はプラン定義の現在の特典をスナップショットする（購入と同じ規則）。
 * 開始は `now`。重ね掛けの繋ぎはしない — 付与は運営者が期間を決めて置くもので、
 * パスの重ね買いのように「残り日数を捨てさせない」配慮が要らない。
 *
 * @returns 付与した行
 */
export async function insertBenefitGrant(
  tx: TransactionClient,
  input: BenefitGrantInput,
  now: Date = new Date(),
): Promise<BenefitGrant> {
  const plan = PLANS[input.plan];
  const expiresAt =
    input.durationDays === undefined
      ? undefined
      : addPassDuration(now, input.durationDays);

  const [row] = await tx
    .insert(benefitGrants)
    .values({
      userId: input.userId,
      plan: plan.key,
      benefits: [...plan.benefits],
      reason: input.reason,
      grantedBy: input.grantedBy,
      startsAt: now,
      expiresAt,
    })
    .returning();
  if (!row) {
    // INSERT ... RETURNING は必ず 1 行返す。ここに来るのはドライバの異常
    throw new Error("insertBenefitGrant: no row returned");
  }
  return row;
}

/**
 * 付与を取り消す（トランザクション内で呼ぶ）。該当行が無いか取消済みなら undefined
 * 付与取り消し
 *
 * 行は消さず `revoked_at` を立てる（購入の返金と同じ論理削除）。
 */
export async function revokeBenefitGrant(
  tx: TransactionClient,
  grantId: string,
  reason: string,
  now: Date = new Date(),
): Promise<BenefitGrant | undefined> {
  const [row] = await tx
    .update(benefitGrants)
    .set({ revokedAt: now, revokeReason: reason })
    .where(and(eq(benefitGrants.id, grantId), isNull(benefitGrants.revokedAt)))
    .returning();
  return row;
}

/**
 * ユーザーへの付与（新しい順）。取り消した行も含む
 * 付与一覧取得
 *
 * マイページの「付与された特典」用。失敗したら空配列（`listPurchases` と
 * 同じく、マイページが落ちるより良い）。ログは残す。
 */
export async function listBenefitGrants(
  userId: string,
): Promise<readonly BenefitGrant[]> {
  try {
    return await db
      .select()
      .from(benefitGrants)
      .where(eq(benefitGrants.userId, userId))
      .orderBy(desc(benefitGrants.createdAt));
  } catch (error) {
    logExternalError("listBenefitGrants", "failed to list grants", error);
    return [];
  }
}
