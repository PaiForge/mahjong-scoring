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
 *
 * @design 同じ人の複数の行は、期限が最も遅い 1 行で代表させる
 *
 * 購入と付与が重なっていた人は、両方が窓に入ると行が 2 つ候補になるが、
 * 本人に起きた出来事は「Pro が終わった」の 1 回。期限が最も遅い行がその瞬間を
 * 指すので、それを対象にして 1 通にする。翌日も同じ行が代表になるので一意
 * インデックスで重複せず、後日また付与されて再び切れたときは新しい行が代表に
 * なるので 2 通目が正しく出る。
 *
 * @design 判定と INSERT の間の競合は塞いでいない
 *
 * 有効な行の読み取りと通知の INSERT は別の文で、その数ミリ秒の間に管理者が
 * 付与を入れると「数分前に Pro に戻った人」に失効の通知が 1 通残る。日次バッチと
 * 手動操作の重なりは稀で、起きても誤報 1 通で済む。本気で塞ぐなら付与・返金側と
 * 共有するロック（`pg_advisory_xact_lock`）が要る — 単一の SQL にしても文の
 * 開始時点のスナップショットで同じ競合が残るので、それでは直らない。
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
  /** 通知の候補になった人数（期限切れの行を人ごとに 1 つに畳んだ数） */
  readonly candidates: number;
  /** 新しく作った通知の数（既にあった分は含まない） */
  readonly notified: number;
}

/**
 * 期限切れの行から通知の内容を組む（純粋関数）
 * 期限切れ通知選別
 *
 * まだ Pro の人（`stillActiveUserIds`）の行は除き、残った人ごとに期限が
 * 最も遅い 1 行を代表にして 1 通にする（上の設計を参照）。
 */
export function selectExpiryNotifications(
  expired: readonly ExpiredEntitlement[],
  stillActiveUserIds: ReadonlySet<string>,
): NotificationInput[] {
  const latestByUser = new Map<string, ExpiredEntitlement>();
  for (const row of expired) {
    if (stillActiveUserIds.has(row.userId)) continue;
    const current = latestByUser.get(row.userId);
    if (!current || row.expiresAt > current.expiresAt) {
      latestByUser.set(row.userId, row);
    }
  }
  return [...latestByUser.values()].map((row) => ({
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
    return { expired: 0, stillActive: 0, candidates: 0, notified: 0 };
  }

  const userIds = [...new Set(expired.map((row) => row.userId))];
  const stillActive = await findUsersWithActiveEntitlement(userIds, now);
  const inputs = selectExpiryNotifications(expired, stillActive);
  const notified = await insertNotifications(db, inputs);

  return {
    expired: expired.length,
    stillActive: expired.filter((row) => stillActive.has(row.userId)).length,
    candidates: inputs.length,
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

  return [
    ...purchaseRows.flatMap((row) =>
      toExpiredEntitlement(row, NotificationTargetType.Purchase),
    ),
    ...grantRows.flatMap((row) =>
      toExpiredEntitlement(row, NotificationTargetType.BenefitGrant),
    ),
  ];
}

/** 購入・付与の行を期限切れの候補にする。期限の無い行は候補にしない */
function toExpiredEntitlement(
  row: {
    readonly id: string;
    readonly userId: string;
    readonly plan: string;
    readonly expiresAt: Date | null;
  },
  type: NotificationTargetType,
): ExpiredEntitlement[] {
  // WHERE で IS NOT NULL を掛けているが、型の上では nullable のまま
  if (!row.expiresAt) return [];
  return [
    {
      userId: row.userId,
      target: { type, id: row.id },
      plan: row.plan,
      expiresAt: row.expiresAt,
    },
  ];
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
