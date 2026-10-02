/**
 * ローカル開発用のサイト内通知の投入
 * 通知シード
 *
 * ヘッダーのベル（未読数）と `/mypage/notifications` の一覧を、ログインするだけで
 * 確認できるよう、購入・付与のシードから導いた通知を入れる。アプリが本番で
 * 書くのと同じ種別・同じ対象（購入行・付与行）・同じ metadata にするため、
 * 文面の分岐（パス / 買い切り / 期限あり / 無期限）がそのまま見える。
 *
 * - bob   — 古いパスの購入完了（既読）と期限切れ（未読）、いまのパスの購入完了（未読）
 * - carol — 買い切りの購入完了（未読）
 * - dave  — 付与（未読）
 *
 * 購入・付与のシードの **後** に走らせる（対象の行の id が要る）。宣言した状態へ
 * 消して入れ直す（購入と同じ方針）。シードユーザーで既読にしても次の実行で戻る。
 *
 * 期限切れの通知は本来 cron（`/api/cron/notify-plan-expiry`）が書くが、bob の
 * 古いパスは 20 日前に切れていて 7 日の窓の外なので cron では付かない。
 * 「期限切れの文面」を画面で見るためにここで直接入れる。
 */
import { inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import {
  benefitGrants,
  notifications,
  purchases,
  type NewNotification,
} from "../../src/lib/db/schema";
import {
  NotificationTargetType,
  NotificationType,
} from "../../src/lib/notifications/types";

/** 投入先のユーザー（`ensureSeedUser` が返した id と username） */
export interface NotificationSeedUser {
  readonly userId: string;
  readonly username: string;
}

/**
 * シードユーザーへの通知を、購入・付与の行から導いて入れ直す
 * 通知再投入
 *
 * @returns 投入した行数
 */
export async function reseedNotifications(
  db: PostgresJsDatabase,
  users: readonly NotificationSeedUser[],
  now: Date = new Date(),
): Promise<number> {
  const userIds = users.map((user) => user.userId);
  if (userIds.length === 0) return 0;

  const [purchaseRows, grantRows] = await Promise.all([
    db.select().from(purchases).where(inArray(purchases.userId, userIds)),
    db
      .select()
      .from(benefitGrants)
      .where(inArray(benefitGrants.userId, userIds)),
  ]);

  const rows: NewNotification[] = [];

  for (const purchase of purchaseRows) {
    const expired = purchase.expiresAt !== null && purchase.expiresAt <= now;
    // 新しいパスを持つ人の「古いパスの購入完了」は読んだことにしておく
    // （未読だけが並ぶより、既読と未読の見分けがつく一覧になる）
    const hasNewer = purchaseRows.some(
      (other) =>
        other.userId === purchase.userId &&
        other.createdAt > purchase.createdAt,
    );
    rows.push({
      userId: purchase.userId,
      type: NotificationType.PurchaseCompleted,
      targetType: NotificationTargetType.Purchase,
      targetId: purchase.id,
      metadata: {
        plan: purchase.plan,
        kind: purchase.kind,
        expiresAt: purchase.expiresAt?.toISOString(),
      },
      readAt: hasNewer ? purchase.createdAt : null,
      createdAt: purchase.createdAt,
    });
    if (expired && purchase.expiresAt && purchase.revokedAt === null) {
      rows.push({
        userId: purchase.userId,
        type: NotificationType.PlanExpired,
        targetType: NotificationTargetType.Purchase,
        targetId: purchase.id,
        metadata: {
          plan: purchase.plan,
          expiresAt: purchase.expiresAt.toISOString(),
        },
        createdAt: purchase.expiresAt,
      });
    }
  }

  for (const grant of grantRows) {
    rows.push({
      userId: grant.userId,
      type: NotificationType.BenefitGranted,
      targetType: NotificationTargetType.BenefitGrant,
      targetId: grant.id,
      metadata: {
        plan: grant.plan,
        expiresAt: grant.expiresAt?.toISOString(),
      },
      createdAt: grant.createdAt,
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(notifications)
      .where(inArray(notifications.userId, userIds));
    if (rows.length > 0) await tx.insert(notifications).values(rows);
  });

  return rows.length;
}
