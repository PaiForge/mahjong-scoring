import { eq } from "drizzle-orm";
import "server-only";

import { appleNotificationEvents, db, type TransactionClient } from "@/lib/db";

/**
 * App Store Server Notification のうち、このアプリが扱う種別
 * 通知種別
 *
 * - `ONE_TIME_CHARGE` — 単発の購入（パス・買い切り）が完了した。アプリからの
 *   送信が届かなかったときの記録の補完に使う
 * - `REFUND` — 返金された。購入を `refunded` で取り消す
 * - `REVOKE` — 返金以外の理由で取り消された（Family Sharing の解除など）。
 *   購入を `revoked` で取り消す
 * - `REFUND_REVERSED` — 返金が覆った。`refunded` の取り消しを戻す
 * - `CONSUMPTION_REQUEST` — 返金の審査で消費情報を求められた。送らない（ログだけ）
 * - `TEST` — 疎通の確認
 *
 * これ以外の種別は処理も記録もしない。
 */
export const AppleNotificationType = {
  OneTimeCharge: "ONE_TIME_CHARGE",
  Refund: "REFUND",
  Revoke: "REVOKE",
  RefundReversed: "REFUND_REVERSED",
  ConsumptionRequest: "CONSUMPTION_REQUEST",
  Test: "TEST",
} as const;
export type AppleNotificationType =
  (typeof AppleNotificationType)[keyof typeof AppleNotificationType];

/**
 * 通知の重複排除
 *
 * Apple は同じ通知を複数回届ける（応答が 2xx でなければ再送する）。処理済みの
 * `notificationUUID` を `apple_notification_events` に残し、2 回目以降は
 * 処理しない。Stripe の Webhook（`webhook-events-log.ts`）と同じく、記録は
 * 処理の **後**。先に記録すると、処理が失敗して Apple が再送したときに
 * 「処理済み」として捨ててしまう。並行して 2 本届けば両方処理されうるが、
 * 購入の記録も取り消しも冪等なので害がない。
 */

/**
 * 処理済みの通知か
 * 通知の処理済み判定
 */
export async function hasProcessedAppleNotification(
  notificationUuid: string,
): Promise<boolean> {
  const [row] = await db
    .select({ uuid: appleNotificationEvents.notificationUuid })
    .from(appleNotificationEvents)
    .where(eq(appleNotificationEvents.notificationUuid, notificationUuid))
    .limit(1);
  return row !== undefined;
}

/**
 * 処理済みの記録に残す通知の識別
 * 通知識別
 */
export interface AppleNotificationIdentity {
  /** 通知の一意な ID（`notificationUUID`） */
  readonly notificationUuid: string;
  /** `REFUND` 等の種別（`notificationType`） */
  readonly notificationType: string;
  readonly subtype: string | undefined;
}

/**
 * 通知を処理済みとして記録する（既にあれば何もしない）
 * 通知の処理済み記録
 *
 * 取引を指す種別（ONE_TIME_CHARGE / REFUND / REVOKE / REFUND_REVERSED）は
 * 取引 ID も残す。REFUND / REVOKE が購入の記録より先に届いて取り消す行が
 * 無かったときも、ここに取引 ID 付きで記録しておけば、後から来た記録
 * （`recordAppleTransaction`）がこれを見て取り消し済みで入れる。
 * App Store Server API で取引の現在の状態を問い合わせない代わり。
 *
 * 取り消し（`revoke.ts`）は取り消す行が無いとき、取引のロックを持った
 * トランザクションの中でここを呼ぶ（`tx` を渡す）。受け口も処理の後に同じ
 * 通知を記録するが、`notification_uuid` の `ON CONFLICT DO NOTHING` で 1 行に
 * 重なる。
 *
 * @param notification.transactionId - 通知が指す取引 ID。取引を伴わない種別は undefined
 * @param tx - 渡されたらそのトランザクションの中で書く。省略時は `db`
 */
export async function markAppleNotificationProcessed(
  {
    notificationUuid,
    notificationType,
    subtype,
    transactionId,
  }: AppleNotificationIdentity & {
    readonly transactionId: string | undefined;
  },
  tx?: TransactionClient,
): Promise<void> {
  await (tx ?? db)
    .insert(appleNotificationEvents)
    .values({
      notificationUuid,
      notificationType,
      subtype: subtype ?? null,
      appleTransactionId: transactionId ?? null,
    })
    .onConflictDoNothing({ target: appleNotificationEvents.notificationUuid });
}
