import "server-only";
import { z } from "zod";

import { logExternalError } from "@/lib/log-error";

import { PurchaseRevokeReason } from "../revoke-reason";
import {
  AppleNotificationType,
  type AppleNotificationIdentity,
} from "./notification-events";
import { recordAppleTransaction } from "./record";
import { reverseAppleRevocation, revokeAppleTransaction } from "./revoke";
import type { AppleNotification } from "./verifier";

/**
 * App Store Server Notification の各種別の処理
 * 通知処理
 *
 * 受け口（`api/apple/notifications/route.ts`）は署名の検証と重複排除だけを
 * 行い、中身の処理はここに置く（Stripe の `webhook-handlers.ts` と同じ分け方）。
 *
 * @design 取り消す行が無くても処理済みにする
 *
 * REFUND / REVOKE が購入の記録より先に届くことがある（アプリが送る前に返金
 * された等）。そのときも処理済みとして扱い、取り消し（`revoke.ts`）が取引の
 * ロックの下で通知を取引 ID 付きで記録する。後から来た記録
 * （`recordAppleTransaction`）が記録表を見て、取り消し済みで入れる。App Store Server API で取引の現在の状態を問い合わせ
 * ない代わりに、記録表がその役を担う。
 *
 * @design 消費情報を送らない
 *
 * CONSUMPTION_REQUEST（返金の審査で Apple が消費の状況を尋ねる）には答えない。
 * 答えるには App Store Server API の鍵が要り、それを持たない選択をしている。
 * 答えなければ Apple は手元の情報だけで審査する。ログだけ残す。
 *
 * 回復不能な見送り（取引が無い・持ち主が分からない）も処理済みとして
 * true を返す。送り直されても直らず、2xx 以外を返し続けると Apple の再送が
 * 続くだけになる。投げるのは DB 障害など一時的な失敗だけで、受け口が 500 を
 * 返して Apple に再送させる。
 */

/** 取引を指す種別。処理済みの記録に取引 ID を残す */
const TRANSACTION_NOTIFICATION_TYPES: ReadonlySet<string> = new Set([
  AppleNotificationType.OneTimeCharge,
  AppleNotificationType.Refund,
  AppleNotificationType.Revoke,
  AppleNotificationType.RefundReversed,
]);

/**
 * 処理済みの記録に残す取引 ID。取引を指さない種別なら undefined
 * 通知の取引ID
 *
 * ONE_TIME_CHARGE / REFUND / REVOKE / REFUND_REVERSED の取引 ID を残し、
 * 返金が記録より先に届いたときに後の記録が見られるようにする
 * （このモジュールの「取り消す行が無くても処理済みにする」）。
 */
export function notificationTransactionId(
  notification: AppleNotification,
): string | undefined {
  return TRANSACTION_NOTIFICATION_TYPES.has(notification.notificationType)
    ? notification.transaction?.transactionId
    : undefined;
}

const appAccountTokenSchema = z.uuid();

/**
 * 通知を種別ごとに処理する。処理した（扱う）種別なら true
 * 通知の振り分け
 *
 * - `TEST` — 何もしない
 * - `ONE_TIME_CHARGE` — 購入を記録する（{@link recordFromOneTimeCharge}）
 * - `REFUND` — 購入を `refunded` で取り消す
 * - `REVOKE` — 購入を `revoked` で取り消す（返金ではない取り消し）
 * - `REFUND_REVERSED` — `refunded` の取り消しを戻す
 * - `CONSUMPTION_REQUEST` — ログだけ（このモジュールの「消費情報を送らない」）
 * - それ以外 — 扱わない。false を返し、受け口は処理済みとして記録しない
 *   （Stripe の購読していないイベントと同じ。扱い始めたときに過去の通知を
 *   処理済みとして捨てないため）
 *
 * @param now - 期限・取り消しの日時の基準
 */
export async function dispatchAppleNotification(
  notification: AppleNotification,
  now: Date = new Date(),
): Promise<boolean> {
  const { notificationType, transaction } = notification;
  switch (notificationType) {
    case AppleNotificationType.Test:
      return true;
    case AppleNotificationType.OneTimeCharge:
      await recordFromOneTimeCharge(notification, now);
      return true;
    case AppleNotificationType.Refund:
    case AppleNotificationType.Revoke:
      if (!transaction) {
        logMissingTransaction(notification);
        return true;
      }
      await revokeAppleTransaction(
        transaction.transactionId,
        notificationType === AppleNotificationType.Refund
          ? PurchaseRevokeReason.Refunded
          : PurchaseRevokeReason.Revoked,
        identityOf(notification),
        now,
      );
      return true;
    case AppleNotificationType.RefundReversed:
      if (!transaction) {
        logMissingTransaction(notification);
        return true;
      }
      await reverseAppleRevocation(
        transaction.transactionId,
        identityOf(notification),
      );
      return true;
    case AppleNotificationType.ConsumptionRequest:
      logExternalError(
        "apple-notification",
        `CONSUMPTION_REQUEST for ${notification.transaction?.transactionId ?? "unknown"} (consumption info is not sent)`,
        undefined,
      );
      return true;
    default:
      return false;
  }
}

/**
 * ONE_TIME_CHARGE — アプリからの送信が届かなかった購入を補完して記録する
 * 単発購入通知の記録
 *
 * 購入の記録はアプリの送信（購入直後・復元）が主で、これは補完。アプリが
 * 送る前に落ちた・通信が切れたまま戻らなかったときにも記録が残るようにする。
 * Apple が単発の購入（Non-Consumable・Non-Renewing Subscription）でこの通知を
 * 本番で送るようになったのは 2025-05-27 から。
 *
 * 記録する本人は取引の `appAccountToken`（アプリが購入時に渡した user_id）。
 * token が無い・UUID でないなら持ち主が分からないので記録しない（ログだけ）。
 * 既にアプリが記録していれば `duplicate`、別人の行なら `ownedByAnotherAccount`
 * で、どれも書き込まずに終わる。結果は何であれ処理済みにする。
 */
async function recordFromOneTimeCharge(
  notification: AppleNotification,
  now: Date,
): Promise<void> {
  const { transaction } = notification;
  if (!transaction) {
    logMissingTransaction(notification);
    return;
  }
  const token = appAccountTokenSchema.safeParse(transaction.appAccountToken);
  if (!token.success) {
    logExternalError(
      "apple-notification",
      `ONE_TIME_CHARGE for ${transaction.transactionId} has no valid appAccountToken; not recorded`,
      undefined,
    );
    return;
  }
  const result = await recordAppleTransaction(token.data, transaction, now);
  if (
    result.outcome === "rejected" ||
    result.outcome === "ownedByAnotherAccount"
  )
    logExternalError(
      "apple-notification",
      `ONE_TIME_CHARGE for ${transaction.transactionId} not recorded (${result.outcome === "rejected" ? result.reason : result.outcome})`,
      undefined,
    );
}

/** 処理済みの記録に残す通知の識別 */
function identityOf(
  notification: AppleNotification,
): AppleNotificationIdentity {
  return {
    notificationUuid: notification.notificationUuid,
    notificationType: notification.notificationType,
    subtype: notification.subtype,
  };
}

/** 取引を指すはずの種別に取引が無い（Apple の仕様上は起きない）ことを残す */
function logMissingTransaction(notification: AppleNotification): void {
  logExternalError(
    "apple-notification",
    `${notification.notificationType} (${notification.notificationUuid}) has no transaction`,
    undefined,
  );
}
