import { and, gt, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import "server-only";

import { benefitGrants, db, purchases } from "@/lib/db";
import { activeEntitlementConditions } from "@/lib/entitlements/has-benefit";

import {
  insertNotifications,
  type NotificationInput,
} from "./create-notification";
import { NotificationTargetType, NotificationType } from "./types";

/**
 * Pro の期限切れの通知 — 日次バッチ
 * 期限切れ通知
 *
 * 30 日パスは自動更新せず、期限が来ると無料プランに戻る（`has-benefit.ts` が
 * 時刻だけで判定する）。その瞬間に何かが動くわけではないので、1 日 1 回の
 * cron（`api/cron/notify-plan-expiry`）が「直近で期限が切れた購入・付与」を
 * 拾って本人に知らせる。
 *
 * @design 走査は直近 {@link EXPIRY_LOOKBACK_MS} に期限が来た行だけ
 *
 * 毎回全件を見ると表が育つほど遅くなる。cron が数日止まっても取りこぼさない
 * 程度に窓を取り、重複は通知側の一意インデックス（同じ購入行には 1 通）に
 * 任せる。窓より前に切れたものはもう知らせない — 時間が経ってから
 * 「切れました」と言われても役に立たない。
 *
 * @design まだ Pro の人には出さない
 *
 * パスを買い直した直後に古いパスが切れる、付与と購入が重なっている、
 * 買い切りを持っている — どれも古い行は「期限切れ」だが本人は Pro のまま。
 * `has-benefit.ts` と同じ条件で有効な行を 1 つでも持つ人は除く。
 * 「Pro（30 日パス）のまま期限が切れました」が届くのは誤報になる。
 *
 * @design 購入と付与を同じ種別（`plan_expired`）で出す
 *
 * 本人に見える出来事は「Pro が切れた」の 1 つで、文面も遷移先も同じ。
 * 出どころは `target_type` が持つので、後から分けたくなっても行から分かる。
 */

/** 期限切れを拾う窓（7 日）。cron が止まっていた分の取りこぼしを吸収する */
export const EXPIRY_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

/** 期限が切れた購入・付与の 1 行 */
export interface ExpiredEntitlement {
  readonly userId: string;
  readonly target: {
    readonly type: NotificationTargetType;
    readonly id: string;
  };
  readonly plan: string;
  readonly expiresAt: Date;
}

/** バッチの結果（ログ・応答用） */
export interface PlanExpiryRunResult {
  /** 窓の中で期限が切れていた行の数 */
  readonly expired: number;
  /** そのうち、まだ Pro の人の行として除いた数 */
  readonly stillActive: number;
  /** 新しく作った通知の数（既にあった分は含まない） */
  readonly notified: number;
}

/**
 * 期限切れの行から通知の内容を組む（純粋関数）
 * 期限切れ通知選別
 *
 * まだ Pro の人（`stillActiveUserIds`）の行は除く。
 */
export function selectExpiryNotifications(
  expired: readonly ExpiredEntitlement[],
  stillActiveUserIds: ReadonlySet<string>,
): NotificationInput[] {
  return expired
    .filter((row) => !stillActiveUserIds.has(row.userId))
    .map((row) => ({
      userId: row.userId,
      type: NotificationType.PlanExpired,
      target: row.target,
      metadata: { plan: row.plan, expiresAt: row.expiresAt.toISOString() },
    }));
}

/**
 * 直近に期限が切れた購入と付与を本人に通知する
 * 期限切れ通知実行
 *
 * @param now - 判定の基準時刻。テストから差し替える
 */
export async function notifyExpiredPlans(
  now: Date = new Date(),
): Promise<PlanExpiryRunResult> {
  const since = new Date(now.getTime() - EXPIRY_LOOKBACK_MS);
  const expired = await findExpiredEntitlements(since, now);
  if (expired.length === 0) {
    return { expired: 0, stillActive: 0, notified: 0 };
  }

  const userIds = [...new Set(expired.map((row) => row.userId))];
  const stillActive = await findUsersWithActiveEntitlement(userIds, now);
  const inputs = selectExpiryNotifications(expired, stillActive);
  const notified = await insertNotifications(db, inputs);

  return {
    expired: expired.length,
    stillActive: expired.length - inputs.length,
    notified,
  };
}

/** `since < expires_at <= now` の、取り消されていない購入と付与 */
async function findExpiredEntitlements(
  since: Date,
  now: Date,
): Promise<ExpiredEntitlement[]> {
  const [purchaseRows, grantRows] = await Promise.all([
    db
      .select({
        id: purchases.id,
        userId: purchases.userId,
        plan: purchases.plan,
        expiresAt: purchases.expiresAt,
      })
      .from(purchases)
      .where(
        and(
          isNull(purchases.revokedAt),
          isNotNull(purchases.expiresAt),
          gt(purchases.expiresAt, since),
          lte(purchases.expiresAt, now),
        ),
      ),
    db
      .select({
        id: benefitGrants.id,
        userId: benefitGrants.userId,
        plan: benefitGrants.plan,
        expiresAt: benefitGrants.expiresAt,
      })
      .from(benefitGrants)
      .where(
        and(
          isNull(benefitGrants.revokedAt),
          isNotNull(benefitGrants.expiresAt),
          gt(benefitGrants.expiresAt, since),
          lte(benefitGrants.expiresAt, now),
        ),
      ),
  ]);

  const rows: ExpiredEntitlement[] = [];
  for (const row of purchaseRows) {
    // WHERE で IS NOT NULL を掛けているが、型の上では nullable のまま
    if (!row.expiresAt) continue;
    rows.push({
      userId: row.userId,
      target: { type: NotificationTargetType.Purchase, id: row.id },
      plan: row.plan,
      expiresAt: row.expiresAt,
    });
  }
  for (const row of grantRows) {
    if (!row.expiresAt) continue;
    rows.push({
      userId: row.userId,
      target: { type: NotificationTargetType.BenefitGrant, id: row.id },
      plan: row.plan,
      expiresAt: row.expiresAt,
    });
  }
  return rows;
}

/** 候補のうち、いま有効な購入か付与を 1 つでも持つ人 */
async function findUsersWithActiveEntitlement(
  userIds: readonly string[],
  now: Date,
): Promise<Set<string>> {
  const [purchaseRows, grantRows] = await Promise.all([
    db
      .select({ userId: purchases.userId })
      .from(purchases)
      .where(
        and(
          inArray(purchases.userId, [...userIds]),
          ...activeEntitlementConditions(purchases, now),
        ),
      ),
    db
      .select({ userId: benefitGrants.userId })
      .from(benefitGrants)
      .where(
        and(
          inArray(benefitGrants.userId, [...userIds]),
          ...activeEntitlementConditions(benefitGrants, now),
        ),
      ),
  ]);
  return new Set([...purchaseRows, ...grantRows].map((row) => row.userId));
}
