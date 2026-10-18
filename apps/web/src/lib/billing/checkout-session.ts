import type Stripe from "stripe";

import type { BillingCheckout } from "@/lib/db";
import {
  PLAN_PAGE_HREF,
  type OfferKey,
} from "@mahjong-scoring/features/billing/plans";

/**
 * 予約から Checkout Session の作成パラメータを組む
 * Checkout Session 作成パラメータ
 *
 * 販売条件（Price・期限・戻り先）は予約に固定した値だけを使う。同じ予約から
 * 何度組んでも同じ値になるので、冪等キー付きの再試行が同じ Session を指す。
 *
 * @param attempt - 購入手続きの予約
 * @param customer - Stripe の顧客 ID
 */
export function checkoutSessionParams(
  attempt: Pick<
    BillingCheckout,
    "id" | "stripePriceId" | "expiresAt" | "origin"
  >,
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

/**
 * Session の状態から購入手続きの次の一手
 * Checkout Session の次の一手
 *
 * - `expired` — Stripe 側で失効。予約を精算して取り直す
 * - `completed` — 支払い済み。購入を記録する（Webhook の遅れを回復する）
 * - `inProgress` — 別の売り方の手続きが進行中。切り替えず最初の手続きへ戻す
 * - `redirect` — 支払い画面へ送る
 * - `missingUrl` — 開いている Session なのに URL が無い（Stripe の異常）
 */
export type CheckoutSessionOutcome =
  | { readonly kind: "expired" }
  | { readonly kind: "completed" }
  | { readonly kind: "inProgress" }
  | { readonly kind: "redirect"; readonly url: string }
  | { readonly kind: "missingUrl" };

/**
 * Session の状態と予約の売り方から、購入手続きの次の一手を決める
 * Checkout Session の判定
 *
 * 判定の順は「失効 → 支払い済み → 売り方の食い違い → URL」。支払い済みの
 * Session は売り方が違っても記録する（もう支払われている）。
 *
 * @param session - 取得または作成した Session
 * @param attempt - 購入手続きの予約
 * @param offerKey - 今回押された売り方
 */
export function checkoutSessionOutcome(
  session: Pick<Stripe.Checkout.Session, "status" | "url">,
  attempt: Pick<BillingCheckout, "offer">,
  offerKey: OfferKey,
): CheckoutSessionOutcome {
  if (session.status === "expired") return { kind: "expired" };
  if (session.status === "complete") return { kind: "completed" };
  if (attempt.offer !== offerKey) return { kind: "inProgress" };
  if (!session.url) return { kind: "missingUrl" };
  return { kind: "redirect", url: session.url };
}
