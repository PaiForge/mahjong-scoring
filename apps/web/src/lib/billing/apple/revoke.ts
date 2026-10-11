import { and, eq, isNull } from "drizzle-orm";
import "server-only";

import { db, purchases } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";
import { notifyQuietly } from "@/lib/notifications/create-notification";
import { lockAccountForWrite } from "@/lib/users/account-write-lock";

import {
  PURCHASE_NOTIFICATION_COLUMNS,
  purchaseNotificationOf,
  type PurchaseNotificationSource,
} from "../purchases";
import { PurchaseRevokeReason } from "../revoke-reason";
import { lockAppleTransaction } from "./transaction-lock";

/**
 * App Store の取引の購入を取り消す
 * 購入取り消し（App Store）
 *
 * REFUND 通知（`refunded`）と REVOKE 通知（`revoked`。Family Sharing の解除など
 * 返金ではない取り消し）から呼ぶ。行は消さず `revoked_at` と理由を立てるだけ
 * （購入履歴に残す）。未取消の行だけを更新するので、再送されても冪等。
 *
 * 取引のロックの後にユーザーの書き込みロックを取り、退会を受け付けたユーザー
 * なら何も書かず `notFound` を返す（退会の処理が行ごと消す）。行が無いときも
 * `notFound` — 返金が購入の記録より先に届いた場合で、呼び出し側は通知を
 * 取引 ID 付きで記録しておき、後から来た記録が取り消し済みで入れる。
 *
 * 本人への通知はトランザクションの外で、失敗しても取り消しを巻き込まない
 * （Stripe の `revokePurchaseByPaymentIntent` と同じ）。既に取り消し済みの
 * 再送でも保存済みの行から通知を組み直して通す（通知の補完）。
 *
 * @returns `revoked` — 取り消した / `alreadyRevoked` — 既に取り消し済み /
 *   `notFound` — 行が無い・退会を受け付けたユーザーの行
 */
export async function revokeAppleTransaction(
  transactionId: string,
  reason:
    typeof PurchaseRevokeReason.Refunded | typeof PurchaseRevokeReason.Revoked,
  now: Date = new Date(),
): Promise<"revoked" | "alreadyRevoked" | "notFound"> {
  const { result, purchase } = await db.transaction(
    async (
      tx,
    ): Promise<{
      readonly result: "revoked" | "alreadyRevoked" | "notFound";
      readonly purchase: PurchaseNotificationSource | undefined;
    }> => {
      await lockAppleTransaction(tx, transactionId);
      const [current] = await tx
        .select(PURCHASE_NOTIFICATION_COLUMNS)
        .from(purchases)
        .where(eq(purchases.appleTransactionId, transactionId))
        .limit(1);
      if (!current) return { result: "notFound", purchase: undefined };
      if (!(await lockAccountForWrite(tx, current.userId))) {
        logExternalError(
          "revokeAppleTransaction",
          `退会を受け付けたユーザーの取引 ${transactionId} は取り消さない`,
          undefined,
        );
        return { result: "notFound", purchase: undefined };
      }
      if (current.revokedAt !== null)
        return { result: "alreadyRevoked", purchase: current };
      const [updated] = await tx
        .update(purchases)
        .set({ revokedAt: now, revokeReason: reason })
        .where(
          and(
            eq(purchases.appleTransactionId, transactionId),
            isNull(purchases.revokedAt),
          ),
        )
        .returning(PURCHASE_NOTIFICATION_COLUMNS);
      return updated
        ? { result: "revoked", purchase: updated }
        : { result: "alreadyRevoked", purchase: current };
    },
  );
  if (purchase?.revokedAt)
    await notifyQuietly(purchaseNotificationOf(purchase));
  return result;
}

/**
 * 返金による取り消しを戻す
 * 返金の取り消しの戻し
 *
 * REFUND_REVERSED 通知（Apple が返金を覆した）から呼ぶ。`refunded` で取り消した
 * 行だけ `revoked_at` / `revoke_reason` を NULL に戻し、特典が再び付く。
 * 管理者が `fraud` で止めた行や REVOKE（`revoked`）の行は戻さない — 返金の
 * 覆りは返金の取り消しだけを打ち消す出来事で、別の理由の取り消しまで解かない。
 *
 * 戻したことは本人に通知しない。通知の種別を増やさずに済ませ、購入履歴の
 * 「返金済み」が消えるだけにする（取り消しの通知は既読のまま残る）。
 *
 * ロックと退会の扱いは {@link revokeAppleTransaction} と同じ。
 *
 * @returns `reversed` — 戻した / `notRefunded` — 取り消されていない、または
 *   返金以外の理由の取り消し / `notFound` — 行が無い・退会を受け付けたユーザーの行
 */
export async function reverseAppleRevocation(
  transactionId: string,
): Promise<"reversed" | "notRefunded" | "notFound"> {
  return db.transaction(async (tx) => {
    await lockAppleTransaction(tx, transactionId);
    const [current] = await tx
      .select({ userId: purchases.userId })
      .from(purchases)
      .where(eq(purchases.appleTransactionId, transactionId))
      .limit(1);
    if (!current) return "notFound";
    if (!(await lockAccountForWrite(tx, current.userId))) {
      logExternalError(
        "reverseAppleRevocation",
        `退会を受け付けたユーザーの取引 ${transactionId} は戻さない`,
        undefined,
      );
      return "notFound";
    }
    const [updated] = await tx
      .update(purchases)
      .set({ revokedAt: null, revokeReason: null })
      .where(
        and(
          eq(purchases.appleTransactionId, transactionId),
          eq(purchases.revokeReason, PurchaseRevokeReason.Refunded),
        ),
      )
      .returning({ id: purchases.id });
    return updated ? "reversed" : "notRefunded";
  });
}
