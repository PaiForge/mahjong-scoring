import type Stripe from "stripe";

import type { BillingCheckout } from "@/lib/db";

/**
 * 支払い済みの Session が、作成前に保存した予約どおりの購入か
 *
 * 予約した Price を 1 個だけ買った Session でなければ記録しない（line_items
 * の取りこぼし・数量の改変・別の Price への差し替えを弾く）。予約に Session ID
 * が保存済みなら、それ以外の Session は同じ予約を名乗っていても受け付けない。
 */
export function sessionMatchesCheckout(
  session: Pick<Stripe.Checkout.Session, "id" | "line_items">,
  checkout: Pick<BillingCheckout, "stripePriceId" | "stripeCheckoutSessionId">,
): boolean {
  const lineItems = session.line_items;
  const [lineItem] = lineItems?.data ?? [];
  return (
    lineItems?.data.length === 1 &&
    !lineItems.has_more &&
    lineItem?.price?.id === checkout.stripePriceId &&
    lineItem.quantity === 1 &&
    (!checkout.stripeCheckoutSessionId ||
      checkout.stripeCheckoutSessionId === session.id)
  );
}

/** Charge が全額返金済みか。0 円の決済は返金済みとみなさない。 */
export function isFullyRefunded(
  charge: Pick<Stripe.Charge, "amount" | "amount_refunded">,
): boolean {
  return charge.amount > 0 && charge.amount_refunded >= charge.amount;
}
