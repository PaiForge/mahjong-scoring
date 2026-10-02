import type Stripe from "stripe";

/**
 * アプリが購読する Stripe Webhook イベント
 * Webhookイベント一覧
 *
 * Webhook エンドポイントの登録（`scripts/stripe-bootstrap.ts`）と、受け口
 * （`src/app/api/stripe/webhook/route.ts`）の両方がこの一覧を参照する。
 * 片方だけ増やすと「届くのに処理しない」「処理できるのに届かない」になる。
 *
 * - `checkout.session.completed` — 購入の記録。Checkout 完了の着地と二重に
 *   受け、`stripe_checkout_session_id` の UNIQUE で 1 行にする
 * - `charge.refunded` — 全額返金による特典の取り消し
 */
export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "charge.refunded",
] as const satisfies readonly Stripe.WebhookEndpointCreateParams.EnabledEvent[];
