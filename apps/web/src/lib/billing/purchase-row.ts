import type Stripe from "stripe";

import type { BillingCheckout, NewPurchase, Purchase } from "@/lib/db";
import { addPassDuration } from "@mahjong-scoring/features/billing/plans";
import { PurchaseRevokeReason } from "./revoke-reason";

/**
 * 支払い済みの Session から購入の行を組み立てる
 * 購入行の組み立て
 *
 * 販売条件（プラン・種別・特典・期間）は作成前に保存した予約が正。開始は
 * 決済（Charge）の時刻で、パスの期限はそこから数える。返金済みで入れる行は
 * 入れた時刻で取り消し済みにする。
 *
 * @param session - 支払い済みの Checkout Session
 * @param paymentIntentId - Session の PaymentIntent
 * @param checkout - Session を作る前に保存した予約
 * @param userId - 予約した顧客の本人
 * @param chargeCreated - Charge の作成時刻（Unix 秒）
 * @param refunded - 返金済みで入れるか
 * @param now - 取り消しの時刻
 */
export function buildPurchaseRow({
  session,
  paymentIntentId,
  checkout,
  userId,
  chargeCreated,
  refunded,
  now,
}: {
  readonly session: Pick<
    Stripe.Checkout.Session,
    "id" | "currency" | "amount_total"
  >;
  readonly paymentIntentId: string;
  readonly checkout: Pick<
    BillingCheckout,
    "plan" | "kind" | "benefits" | "durationDays"
  >;
  readonly userId: string;
  readonly chargeCreated: number;
  readonly refunded: boolean;
  readonly now: Date;
}): NewPurchase & Pick<Purchase, "expiresAt" | "revokedAt" | "revokeReason"> {
  const startsAt = new Date(chargeCreated * 1000);
  return {
    userId,
    plan: checkout.plan,
    kind: checkout.kind,
    benefits: checkout.benefits,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    currency: (session.currency ?? "jpy").toLowerCase(),
    amount: session.amount_total ?? 0,
    startsAt,
    expiresAt:
      checkout.durationDays === null
        ? null
        : addPassDuration(startsAt, checkout.durationDays),
    revokedAt: refunded ? now : null,
    revokeReason: refunded ? PurchaseRevokeReason.Refunded : null,
  };
}
