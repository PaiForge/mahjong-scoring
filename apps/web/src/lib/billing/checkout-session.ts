import type Stripe from "stripe";

import { localizedHref } from "@/i18n/public-path";
import type { BillingCheckout } from "@/lib/db";
import {
  PLAN_PAGE_HREF,
  type OfferKey,
} from "@mahjong-scoring/features/billing/plans";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * 予約から Checkout Session の作成パラメータを組む
 * Checkout Session 作成パラメータ
 *
 * 販売条件（Price・期限・戻り先・言語）は予約に固定した値だけを使う。同じ予約から
 * 何度組んでも同じ値になるので、冪等キー付きの再試行が同じ Session を指す。
 * 言語を呼び出し時の値から取らないのもこのため（取ると同じ冪等キーで別の
 * パラメータを送り得る）。
 *
 * 言語は予約の `locale` から 3 か所に効く:
 *
 * - `locale` — Stripe の Checkout 画面の UI の言語（商品名・説明は Dashboard の
 *   値がそのまま出る）
 * - `cancel_url` — その言語の料金ページ（英語は `/en/plan`）
 * - `success_url` — `&locale=<locale>` を載せ、完了の着地がその言語の
 *   マイページへ戻す。着地は未ログインの分岐を DB を読む前に持つので、
 *   言語は予約の再読込ではなく URL が運ぶ。言語で分岐せず予約の値を
 *   そのまま載せるため、日本語でも `&locale=ja` が付く
 *
 * @param attempt - 購入手続きの予約
 * @param customer - Stripe の顧客 ID
 */
export function checkoutSessionParams(
  attempt: Pick<
    BillingCheckout,
    "id" | "stripePriceId" | "expiresAt" | "origin" | "locale"
  >,
  customer: string,
): Stripe.Checkout.SessionCreateParams {
  const locale = reservationLocale(attempt.locale);
  return {
    customer,
    mode: "payment",
    line_items: [{ price: attempt.stripePriceId, quantity: 1 }],
    allowed_payment_method_types: ["card"],
    locale,
    expires_at: Math.floor(attempt.expiresAt.getTime() / 1000),
    success_url: `${attempt.origin}/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}&locale=${locale}`,
    cancel_url: `${attempt.origin}${localizedHref(PLAN_PAGE_HREF, locale)}`,
    metadata: { billingCheckoutId: attempt.id },
  };
}

/**
 * 予約に保存した言語を対応言語に絞る
 * 予約の言語
 *
 * 列は `varchar` で型が値を守らない（CHECK 制約も対応言語の二重管理を
 * 避けて持たない）。対応言語でない保存値は既定の日本語として扱う。
 * 対応言語（`ja` / `en`）はどちらも Stripe の Checkout の `locale` の値と同じ綴り。
 */
function reservationLocale(value: string): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
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
