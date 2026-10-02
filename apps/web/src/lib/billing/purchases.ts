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
import { addPassDuration, PurchaseKind } from "./plans";
import { getStripe } from "./stripe";

/** 購入取消理由。返金は全額のみ。 */
export const PurchaseRevokeReason = {
  Refunded: "refunded",
  Fraud: "fraud",
} as const;
export type PurchaseRevokeReason =
  (typeof PurchaseRevokeReason)[keyof typeof PurchaseRevokeReason];

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
 * 行を新しく作ったときだけ本人に通知する（購入完了、返金済みで入れたなら
 * 取り消し）。通知はトランザクションの外で、失敗しても記録を巻き込まずに
 * 書く（`notifyQuietly`）。着地と Webhook の両方がここを通っても、通知側の
 * 一意インデックスで 1 通になる。
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
        .select({ id: purchases.id })
        .from(purchases)
        .where(eq(purchases.stripeCheckoutSessionId, session.id))
        .limit(1);
      if (existing) return { outcome: "duplicate" };

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
      if (
        checkout.stripePriceId !== lineItem.price?.id ||
        lineItem.quantity !== 1 ||
        session.line_items?.data.length !== 1 ||
        session.line_items.has_more ||
        (checkout.stripeCheckoutSessionId &&
          checkout.stripeCheckoutSessionId !== session.id)
      ) {
        return { outcome: "ignored", reason: "invalidCheckout" };
      }

      const stripe = getStripe();
      const payment = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });
      const charge = payment.latest_charge;
      if (!charge || typeof charge === "string")
        throw new Error("Paid Checkout has no expanded charge");
      let refunded =
        charge.amount > 0 && charge.amount_refunded >= charge.amount;
      if (!refunded && (await hasUnexpiredPurchase(tx, customer.userId, now))) {
        const refund = await stripe.refunds.create(
          { payment_intent: paymentIntentId },
          { idempotencyKey: `duplicate-purchase:${paymentIntentId}` },
        );
        if (refund.status === "failed" || refund.status === "canceled")
          throw new Error("Duplicate purchase refund failed");
        refunded = true;
      }
      const startsAt = new Date(charge.created * 1000);
      const expiresAt =
        checkout.durationDays === null
          ? null
          : addPassDuration(startsAt, checkout.durationDays);
      const [inserted] = await tx
        .insert(purchases)
        .values({
          userId: customer.userId,
          plan: checkout.plan,
          kind: checkout.kind,
          benefits: checkout.benefits,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          currency: (session.currency ?? "jpy").toLowerCase(),
          amount: session.amount_total ?? 0,
          startsAt,
          expiresAt,
          revokedAt: refunded ? now : null,
          revokeReason: refunded ? PurchaseRevokeReason.Refunded : null,
        })
        .onConflictDoNothing({ target: purchases.stripeCheckoutSessionId })
        .returning({ id: purchases.id });
      await tx
        .update(billingCheckouts)
        .set({ stripeCheckoutSessionId: session.id, settledAt: now })
        .where(eq(billingCheckouts.id, checkout.id));
      if (!inserted) return { outcome: "duplicate" };
      notification = {
        userId: customer.userId,
        type: refunded
          ? NotificationType.PurchaseRevoked
          : NotificationType.PurchaseCompleted,
        target: { type: NotificationTargetType.Purchase, id: inserted.id },
        metadata: {
          plan: checkout.plan,
          kind: purchaseKindOf(checkout.kind),
          expiresAt: expiresAt?.toISOString(),
          revokeReason: refunded ? PurchaseRevokeReason.Refunded : undefined,
        },
      };
      return {
        outcome: refunded ? "refunded" : "recorded",
        purchaseId: inserted.id,
      };
    },
  );
  if (notification) await notifyQuietly(notification);
  return result;
}

/** varchar の `kind` を `PurchaseKind` に絞る。知らない値は通知に載せない */
function purchaseKindOf(value: string): PurchaseKind | undefined {
  return value === PurchaseKind.Pass || value === PurchaseKind.Lifetime
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
 * 立てるだけ（購入履歴に「返金済み」として残す）。取り消せたら本人に通知する
 * （トランザクションの外、失敗しても取り消しを巻き込まない）。
 */
export async function revokePurchaseByPaymentIntent(
  paymentIntentId: string,
  reason: PurchaseRevokeReason,
  now: Date = new Date(),
): Promise<boolean> {
  const revoked = await db.transaction(async (tx) => {
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
      .returning({
        id: purchases.id,
        userId: purchases.userId,
        plan: purchases.plan,
        kind: purchases.kind,
      });
    return updated;
  });
  if (!revoked) return false;
  await notifyQuietly({
    userId: revoked.userId,
    type: NotificationType.PurchaseRevoked,
    target: { type: NotificationTargetType.Purchase, id: revoked.id },
    metadata: {
      plan: revoked.plan,
      kind: purchaseKindOf(revoked.kind),
      revokeReason: reason,
    },
  });
  return true;
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
