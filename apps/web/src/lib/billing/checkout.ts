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
import { getOrCreateStripeCustomerId } from "./customer";
import { getOfferPriceId } from "./env";
import { PLANS, PurchaseKind, PLAN_PAGE_HREF, type OfferKey } from "./plans";
import { recordPurchaseFromCheckoutSession } from "./purchases";
import { getStripe } from "./stripe";

/** 購入手続きの拒否理由。販売中のパスも買い切りも追加購入させない。 */
export type CheckoutError =
  | "alreadyActive"
  | "checkoutInProgress"
  | "checkoutExpired"
  | "checkoutPending";

/**
 * 未完了 Checkout を再利用し、無ければ販売条件を固定して作る。
 * 購入手続き開始
 *
 * 予約の COMMIT を Stripe API より先にする。ネットワーク失敗やプロセス停止でも
 * 同じ冪等キー・パラメータで再試行できる。発行も顧客ロックの中で行い、並行した
 * 作成・購入記録と競合させない。URL は Session ID の保存が COMMIT した後だけ返す。
 * 別の売り方の手続きがある場合は切り替えず、最初の手続きへ戻るよう案内する。
 */
export async function openCheckout(
  userId: string,
  email: string | undefined,
  offerKey: OfferKey,
  origin: string,
): Promise<{ readonly url: string } | { readonly error: CheckoutError }> {
  const customerId = await getOrCreateStripeCustomerId(userId, email);
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
        // Stripe の許容範囲（30分〜24時間）内。再試行の余裕を残して 1 時間。
        expiresAt: new Date((Math.floor(now.getTime() / 1000) + 3600) * 1000),
      })
      .returning();
    if (!created) throw new Error("Checkout reservation failed");
    return created;
  });
  if ("error" in reserved) return reserved;

  const result = await db.transaction(async (tx) => {
    const customer = await lockBillingCustomer(tx, customerId);
    if (!customer) throw new Error("Billing customer no longer exists");
    if (await hasUnexpiredPurchase(tx, userId, new Date()))
      return { error: "alreadyActive" } as const;
    const [attempt] = await tx
      .select()
      .from(billingCheckouts)
      .where(eq(billingCheckouts.id, reserved.id));
    if (!attempt || attempt.settledAt)
      return { error: "checkoutExpired" } as const;
    const stripe = getStripe();
    // ID が未保存なら URL は渡していない。Stripe は作成時に残り30分以上を要求する。
    if (
      !attempt.stripeCheckoutSessionId &&
      attempt.expiresAt.getTime() <= Date.now() + 30 * 60 * 1000
    ) {
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
