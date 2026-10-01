"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/action-types";
import { authenticateAndCheckBan, type AuthGateErrorCode } from "@/lib/auth";
import { getOrCreateStripeCustomerId } from "@/lib/billing/customer";
import { getOfferPriceId } from "@/lib/billing/env";
import { PLAN_PAGE_HREF, isOfferKey, type OfferKey } from "@/lib/billing/plans";
import { hasActiveLifetimePurchase } from "@/lib/billing/purchases";
import { getStripe } from "@/lib/billing/stripe";
import { SITE_URL } from "@/config";
import { requestOrigin } from "@/lib/csrf";
import { logExternalError } from "@/lib/log-error";
import {
  enforceIpRateLimit,
  type RateLimitErrorCode,
} from "@/lib/rate-limit-ip";

/** Checkout 完了の着地（Route Handler）。`{CHECKOUT_SESSION_ID}` は Stripe が埋める */
const CHECKOUT_COMPLETE_PATH =
  "/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}";

export type CreateCheckoutSessionError =
  | RateLimitErrorCode
  | AuthGateErrorCode
  | "invalidOffer"
  | "alreadyLifetime"
  | "checkoutFailed";

/**
 * Stripe Checkout を作って決済画面へ送る
 * Checkout作成
 *
 * 成功時は `redirect()` で Stripe の決済画面へ飛ぶので、戻り値の `success`
 * には到達しない。失敗はエラーコードで返し、UI が辞書（`plan.errors.*`）で
 * 文言にする。
 *
 * - ガードは `authenticateAndCheckBan`（Server Action は POST の入口なので、
 *   ページのガードとは別にここで見る）と IP レート制限
 * - **買い切りを持つ人には売らない**（パスも買い切りも）。二重購入の防止
 * - `customer` は `stripe_customers` から（無ければ作る）。購入の所有者は
 *   この対応で決まる（`purchases.ts`）
 * - 戻り先は `requestOrigin()`（今いる環境）。無ければ `SITE_URL`
 *
 * @param offer - 売り方（`"pass"` | `"lifetime"`）。クライアントの入力なので絞る
 */
export async function createCheckoutSession(
  offer: string,
): Promise<ActionResult<CreateCheckoutSessionError>> {
  if (!isOfferKey(offer)) return { error: "invalidOffer" };

  const rateLimited = await enforceIpRateLimit("createCheckoutSession");
  if (rateLimited) return rateLimited;

  const auth = await authenticateAndCheckBan();
  if ("error" in auth) return auth;
  const { user } = auth;

  if (await hasActiveLifetimePurchase(user.id)) {
    return { error: "alreadyLifetime" };
  }

  const origin = requestOrigin(await headers()) ?? SITE_URL;
  let checkoutUrl: string | null;
  try {
    const customer = await getOrCreateStripeCustomerId(user.id, user.email);
    const session = await getStripe().checkout.sessions.create({
      customer,
      mode: "payment",
      line_items: [{ price: getOfferPriceId("pro", offer), quantity: 1 }],
      // 当面カードのみ（Dashboard の設定に依らずここで固定する）。コンビニ等の
      // 非同期決済を足すときは `checkout.session.async_payment_succeeded` の処理が要る
      allowed_payment_method_types: ["card"],
      locale: "ja",
      success_url: `${origin}${CHECKOUT_COMPLETE_PATH}`,
      cancel_url: `${origin}${PLAN_PAGE_HREF}`,
      metadata: { supabaseUserId: user.id, offer: satisfiesOffer(offer) },
    });
    checkoutUrl = session.url;
  } catch (error) {
    logExternalError(
      "createCheckoutSession",
      "failed to create a Checkout session",
      error,
    );
    return { error: "checkoutFailed" };
  }

  if (!checkoutUrl) return { error: "checkoutFailed" };
  redirect(checkoutUrl);
}

/** metadata は string しか持てないので型を落とすだけの関数 */
function satisfiesOffer(offer: OfferKey): string {
  return offer;
}
