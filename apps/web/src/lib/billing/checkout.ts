import { and, eq, isNull } from "drizzle-orm";
import "server-only";
import type Stripe from "stripe";

import {
  billingCheckouts,
  db,
  type BillingCheckout,
  type TransactionClient,
} from "@/lib/db";
import { hasUnexpiredPurchase, lockBillingCustomer } from "./checkout-state";
import {
  isReservationTooLateForSession,
  reservationExpiresAt,
} from "./checkout-window";
import { getOrCreateStripeCustomerId } from "./customer";
import { getOfferPriceId } from "./env";
import {
  PLANS,
  PurchaseKind,
  PLAN_PAGE_HREF,
  type OfferKey,
} from "@mahjong-scoring/features/billing/plans";
import { recordPurchaseFromCheckoutSession } from "./purchases";
import { getStripe } from "./stripe";

/**
 * 購入手続きの拒否理由。販売中のパスも買い切りも追加購入させない。
 * `checkoutExpired` は失効した手続きの置き換えが {@link MAX_RESERVATION_ATTEMPTS}
 * 回続けて失効した場合だけ返る（通常は同じ呼び出しの中で新しい手続きに
 * 置き換わる）。
 */
export type CheckoutError =
  | "alreadyActive"
  | "checkoutInProgress"
  | "checkoutExpired"
  | "checkoutPending";

/**
 * 1 回の呼び出しで手続きを予約し直す上限。失効した予約を精算したら新しい
 * 予約で 1 度だけやり直す。予約した直後に失効する状況は通常起きないので、
 * 2 回続けて失効するなら時計や設定の異常として諦めて返す（無限に回さない）
 */
const MAX_RESERVATION_ATTEMPTS = 2;

/**
 * 未完了 Checkout を再利用し、無ければ販売条件を固定して作る。
 * 購入手続き開始
 *
 * 予約の COMMIT を Stripe API より先にする。ネットワーク失敗やプロセス停止でも
 * 同じ冪等キー・パラメータで再試行できる。発行も顧客ロックの中で行い、並行した
 * 作成・購入記録と競合させない。URL は Session ID の保存が COMMIT した後だけ返す。
 * 別の売り方の手続きがある場合は切り替えず、最初の手続きへ戻るよう案内する。
 *
 * 予約が失効していた（Stripe 側で Session が期限切れ、または ID 未発行のまま
 * 期限が迫った）場合は精算して、同じ呼び出しの中で新しい予約からやり直す。
 * 「期限が切れました。もう一度押してください」を 1 回挟む理由が利用者側に
 * 無いため。やり直しでも購入可否（有効な購入の有無）は予約・発行の両方の
 * トランザクションで改めて確かめる
 */
export async function openCheckout(
  userId: string,
  email: string | undefined,
  offerKey: OfferKey,
  origin: string,
): Promise<{ readonly url: string } | { readonly error: CheckoutError }> {
  const customerId = await getOrCreateStripeCustomerId(userId, email);
  for (let attempt = 1; ; attempt++) {
    const result = await reserveAndActivate(
      userId,
      customerId,
      offerKey,
      origin,
    );
    if (result.error !== "checkoutExpired") return result;
    if (attempt >= MAX_RESERVATION_ATTEMPTS) return result;
  }
}

/** 予約（第 1 トランザクション）と Session の発行（第 2 トランザクション）を 1 回行う */
async function reserveAndActivate(
  userId: string,
  customerId: string,
  offerKey: OfferKey,
  origin: string,
): Promise<
  | { readonly url: string; readonly error?: undefined }
  | { readonly error: CheckoutError; readonly url?: undefined }
> {
  const reserved = await db.transaction(async (tx) => {
    const customer = await lockBillingCustomer(tx, customerId);
    if (!customer) throw new Error("Billing customer no longer exists");
    const now = new Date();
    if (await hasUnexpiredPurchase(tx, userId, now))
      return { error: "alreadyActive" } as const;
    const [pending] = await tx
      .select()
      .from(billingCheckouts)
      .where(
        and(
          eq(billingCheckouts.customerId, customer.id),
          isNull(billingCheckouts.settledAt),
        ),
      );
    if (pending) return pending;
    const plan = PLANS.pro;
    const offer = plan.offers[offerKey];
    const [created] = await tx
      .insert(billingCheckouts)
      .values({
        customerId: customer.id,
        plan: plan.key,
        offer: offerKey,
        kind: offer.kind,
        benefits: [...plan.benefits],
        durationDays:
          offer.kind === PurchaseKind.Pass ? offer.durationDays : null,
        stripePriceId: getOfferPriceId(plan.key, offerKey),
        origin,
        expiresAt: reservationExpiresAt(now),
      })
      .returning();
    if (!created) throw new Error("Checkout reservation failed");
    return created;
  });
  if ("error" in reserved) return reserved;

  const result = await db.transaction(async (tx) => {
    const customer = await lockBillingCustomer(tx, customerId);
    if (!customer) throw new Error("Billing customer no longer exists");
    const now = new Date();
    if (await hasUnexpiredPurchase(tx, userId, now))
      return { error: "alreadyActive" } as const;
    const [attempt] = await tx
      .select()
      .from(billingCheckouts)
      .where(eq(billingCheckouts.id, reserved.id));
    if (!attempt || attempt.settledAt)
      return { error: "checkoutExpired" } as const;
    const stripe = getStripe();
    if (isReservationTooLateForSession(attempt, now)) {
      await settle(tx, attempt.id);
      return { error: "checkoutExpired" } as const;
    }
    const session = attempt.stripeCheckoutSessionId
      ? await stripe.checkout.sessions.retrieve(
          attempt.stripeCheckoutSessionId,
          { expand: ["line_items"] },
        )
      : await stripe.checkout.sessions.create(
          checkoutParams(attempt, customerId),
          { idempotencyKey: `checkout:${attempt.id}` },
        );
    await tx
      .update(billingCheckouts)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(billingCheckouts.id, attempt.id));
    if (session.status === "expired") {
      await settle(tx, attempt.id);
      return { error: "checkoutExpired" } as const;
    }
    if (session.status === "complete") return { completed: session } as const;
    if (attempt.offer !== offerKey)
      return { error: "checkoutInProgress" } as const;
    if (!session.url) throw new Error("Checkout has no URL");
    return { url: session.url };
  });
  if ("completed" in result && result.completed) {
    // ロックを解放してから同じ購入記録関数へ。Webhook が遅れていても回復する。
    await recordPurchaseFromCheckoutSession(result.completed);
    return { error: "checkoutPending" };
  }
  if ("url" in result && result.url) return { url: result.url };
  return { error: result.error ?? "checkoutPending" };
}

function checkoutParams(
  attempt: BillingCheckout,
  customer: string,
): Stripe.Checkout.SessionCreateParams {
  return {
    customer,
    mode: "payment",
    line_items: [{ price: attempt.stripePriceId, quantity: 1 }],
    allowed_payment_method_types: ["card"],
    locale: "ja",
    expires_at: Math.floor(attempt.expiresAt.getTime() / 1000),
    success_url: `${attempt.origin}/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${attempt.origin}${PLAN_PAGE_HREF}`,
    metadata: { billingCheckoutId: attempt.id },
  };
}

async function settle(tx: TransactionClient, id: string): Promise<void> {
  await tx
    .update(billingCheckouts)
    .set({ settledAt: new Date() })
    .where(eq(billingCheckouts.id, id));
}
