import { and, desc, eq, isNull, sql } from "drizzle-orm";
import "server-only";
import type Stripe from "stripe";
import { z } from "zod";

import {
  billingCheckouts,
  db,
  purchases,
  type Purchase,
  type TransactionClient,
} from "@/lib/db";
import { logExternalError } from "@/lib/log-error";
import {
  notifyQuietly,
  type NotificationInput,
} from "@/lib/notifications/create-notification";
import {
  NotificationTargetType,
  NotificationType,
} from "@/lib/notifications/types";
import { hasUnexpiredPurchase, lockBillingCustomer } from "./checkout-state";
import {
  isFullyRefunded,
  sessionMatchesCheckout,
} from "./checkout-session-match";
import { PurchaseKind } from "@mahjong-scoring/features/billing/plans";
import { buildPurchaseRow } from "./purchase-row";
import { PurchaseRevokeReason } from "./revoke-reason";
import { getStripe } from "./stripe";

/** 記録を見送った理由。予約のない決済には現在のプラン定義を推測して付けない。 */
export type PurchaseIgnoredReason =
  | "notPaid"
  | "missingLineItems"
  | "unknownCheckout"
  | "invalidCheckout"
  | "unknownCustomer"
  | "missingPaymentIntent";

/** 購入記録の結果。返金済みは購入履歴だけを残す。 */
export type RecordPurchaseResult =
  | { readonly outcome: "recorded" | "refunded"; readonly purchaseId: string }
  | { readonly outcome: "duplicate" }
  | { readonly outcome: "ignored"; readonly reason: PurchaseIgnoredReason };

function idOf(
  value: string | { readonly id: string } | null | undefined,
): string | undefined {
  return typeof value === "string" ? value : value?.id;
}

/**
 * Stripe の現在の Checkout Session から購入を記録する。
 * 購入記録
 *
 * 着地と Webhook は line_items を展開して取り直した Session を渡す。
 * 所有者は session.customer と stripe_customers、販売条件は作成前に保存した
 * billing_checkouts が正。現在の Price 環境変数や PLANS は参照しない。
 *
 * 顧客 → PaymentIntent の順でロックし、同一 Session の再送を冪等に扱う。
 * 重ね買いはしない。万一別 Session の決済が競合した場合は後の決済を全額返金し、
 * 取消済みとして履歴に残す。返金 API は PaymentIntent ごとの冪等キーを使う。
 * 返金イベントが先に来ていても Charge の現在値から取消を復元する。
 *
 * 本人への通知（購入完了、返金済みで入れたなら取り消し）はトランザクションの
 * 外で、失敗しても記録を巻き込まずに書く（`notifyQuietly`）。同じ Session の
 * 再送（`duplicate`）でも保存済みの行から通知を組み直して通す — 初回の通知だけが
 * 失敗したとき、Webhook の再送が補完の経路になる。通知側の一意インデックスで
 * 何度通っても 1 通。保証は「最大 1 通」で、再送が来なければ 0 通のままあり得る。
 */
export async function recordPurchaseFromCheckoutSession(
  session: Stripe.Checkout.Session,
  now: Date = new Date(),
): Promise<RecordPurchaseResult> {
  if (session.mode !== "payment" || session.payment_status !== "paid")
    return { outcome: "ignored", reason: "notPaid" };
  const lineItem = session.line_items?.data[0];
  if (!lineItem?.price?.id)
    return { outcome: "ignored", reason: "missingLineItems" };
  const paymentIntentId = idOf(session.payment_intent);
  if (!paymentIntentId)
    return { outcome: "ignored", reason: "missingPaymentIntent" };
  const customerId = idOf(session.customer);
  if (!customerId) return { outcome: "ignored", reason: "unknownCustomer" };

  // 新しく作った行の通知。トランザクションが成功してから書く
  let notification: NotificationInput | undefined;
  const result = await db.transaction(
    async (tx): Promise<RecordPurchaseResult> => {
      const customer = await lockBillingCustomer(tx, customerId);
      if (!customer) return { outcome: "ignored", reason: "unknownCustomer" };
      await lockPaymentIntent(tx, paymentIntentId);
      const [existing] = await tx
        .select(PURCHASE_NOTIFICATION_COLUMNS)
        .from(purchases)
        .where(eq(purchases.stripeCheckoutSessionId, session.id))
        .limit(1);
      if (existing) {
        notification = purchaseNotificationOf(existing);
        return { outcome: "duplicate" };
      }

      const checkoutId = z
        .string()
        .uuid()
        .safeParse(session.metadata?.billingCheckoutId);
      if (!checkoutId.success)
        return { outcome: "ignored", reason: "unknownCheckout" };
      const [checkout] = await tx
        .select()
        .from(billingCheckouts)
        .where(
          and(
            eq(billingCheckouts.id, checkoutId.data),
            eq(billingCheckouts.customerId, customer.id),
          ),
        )
        .limit(1);
      if (!checkout) return { outcome: "ignored", reason: "unknownCheckout" };
      if (!sessionMatchesCheckout(session, checkout))
        return { outcome: "ignored", reason: "invalidCheckout" };

      const stripe = getStripe();
      const payment = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });
      const charge = payment.latest_charge;
      if (!charge || typeof charge === "string")
        throw new Error("Paid Checkout has no expanded charge");
      let refunded = isFullyRefunded(charge);
      if (!refunded && (await hasUnexpiredPurchase(tx, customer.userId, now))) {
        const refund = await stripe.refunds.create(
          { payment_intent: paymentIntentId },
          { idempotencyKey: `duplicate-purchase:${paymentIntentId}` },
        );
        if (refund.status === "failed" || refund.status === "canceled")
          throw new Error("Duplicate purchase refund failed");
        refunded = true;
      }
      const row = buildPurchaseRow({
        session,
        paymentIntentId,
        checkout,
        userId: customer.userId,
        chargeCreated: charge.created,
        refunded,
        now,
      });
      const [inserted] = await tx
        .insert(purchases)
        .values(row)
        .onConflictDoNothing({ target: purchases.stripeCheckoutSessionId })
        .returning({ id: purchases.id });
      await tx
        .update(billingCheckouts)
        .set({ stripeCheckoutSessionId: session.id, settledAt: now })
        .where(eq(billingCheckouts.id, checkout.id));
      if (!inserted) return { outcome: "duplicate" };
      notification = purchaseNotificationOf({ ...row, id: inserted.id });
      return {
        outcome: refunded ? "refunded" : "recorded",
        purchaseId: inserted.id,
      };
    },
  );
  if (notification) await notifyQuietly(notification);
  return result;
}

/** 通知を組むのに要る購入行の列 */
const PURCHASE_NOTIFICATION_COLUMNS = {
  id: purchases.id,
  userId: purchases.userId,
  plan: purchases.plan,
  kind: purchases.kind,
  expiresAt: purchases.expiresAt,
  revokedAt: purchases.revokedAt,
  revokeReason: purchases.revokeReason,
} as const;

/** 購入行のうち通知が見る部分 */
type PurchaseNotificationSource = Pick<
  Purchase,
  "id" | "userId" | "plan" | "kind" | "expiresAt" | "revokedAt" | "revokeReason"
>;

/**
 * 購入行の現在の状態から本人への通知を組む
 * 購入通知生成
 *
 * 取り消し済みなら取り消し、そうでなければ購入完了。初回の記録でも再送でも
 * 同じ行から同じ通知になるので、再送が通知の補完になる。
 */
function purchaseNotificationOf(
  purchase: PurchaseNotificationSource,
): NotificationInput {
  const revoked = purchase.revokedAt !== null;
  return {
    userId: purchase.userId,
    type: revoked
      ? NotificationType.PurchaseRevoked
      : NotificationType.PurchaseCompleted,
    target: { type: NotificationTargetType.Purchase, id: purchase.id },
    metadata: {
      plan: purchase.plan,
      kind: purchaseKindOf(purchase.kind),
      expiresAt: purchase.expiresAt?.toISOString(),
      revokeReason: revoked
        ? purchaseRevokeReasonOf(purchase.revokeReason)
        : undefined,
    },
  };
}

/** varchar の `kind` を `PurchaseKind` に絞る。知らない値は通知に載せない */
function purchaseKindOf(value: string): PurchaseKind | undefined {
  return value === PurchaseKind.Pass || value === PurchaseKind.Lifetime
    ? value
    : undefined;
}

/** varchar の `revoke_reason` を `PurchaseRevokeReason` に絞る */
function purchaseRevokeReasonOf(
  value: string | null,
): PurchaseRevokeReason | undefined {
  return value === PurchaseRevokeReason.Refunded ||
    value === PurchaseRevokeReason.Fraud
    ? value
    : undefined;
}

/**
 * ユーザーの購入履歴（新しい順）。取り消した行も含む
 * 購入履歴取得
 *
 * 失敗したら空配列（履歴の欠落は「無い」と区別できないが、マイページが
 * 落ちるより良い）。ログは残す。
 */
export async function listPurchases(
  userId: string,
): Promise<readonly Purchase[]> {
  try {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.userId, userId))
      .orderBy(desc(purchases.createdAt));
  } catch (error) {
    logExternalError("listPurchases", "failed to list purchases", error);
    return [];
  }
}

/**
 * PaymentIntent から購入を取り消す。該当行が無いか既に取消済みなら false
 * 購入取り消し
 *
 * Webhook の `charge.refunded`（全額）から呼ぶ。行は消さず `revoked_at` を
 * 立てるだけ（購入履歴に「返金済み」として残す）。本人への通知は
 * トランザクションの外で、失敗しても取り消しを巻き込まない。既に取消済みの
 * 再送でも保存済みの行から通知を組み直して通す（購入の記録と同じ補完）。
 */
export async function revokePurchaseByPaymentIntent(
  paymentIntentId: string,
  reason: PurchaseRevokeReason,
  now: Date = new Date(),
): Promise<boolean> {
  const { revoked, purchase } = await db.transaction(async (tx) => {
    await lockPaymentIntent(tx, paymentIntentId);
    const [updated] = await tx
      .update(purchases)
      .set({ revokedAt: now, revokeReason: reason })
      .where(
        and(
          eq(purchases.stripePaymentIntentId, paymentIntentId),
          isNull(purchases.revokedAt),
        ),
      )
      .returning(PURCHASE_NOTIFICATION_COLUMNS);
    if (updated) return { revoked: true, purchase: updated };
    // 取消済みか不存在。取消済みなら再送として通知を補完する
    const [current] = await tx
      .select(PURCHASE_NOTIFICATION_COLUMNS)
      .from(purchases)
      .where(eq(purchases.stripePaymentIntentId, paymentIntentId))
      .limit(1);
    return { revoked: false, purchase: current };
  });
  if (purchase?.revokedAt)
    await notifyQuietly(purchaseNotificationOf(purchase));
  return revoked;
}

/** 購入の INSERT と取消の UPDATE を PaymentIntent ごとに直列化する。 */
async function lockPaymentIntent(
  tx: TransactionClient,
  paymentIntentId: string,
): Promise<void> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`billing-payment:${paymentIntentId}`}, 0))`,
  );
}
