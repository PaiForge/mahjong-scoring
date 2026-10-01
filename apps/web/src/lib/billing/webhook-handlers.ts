import "server-only";
import type Stripe from "stripe";

import { logExternalError } from "@/lib/log-error";

import {
  PurchaseRevokeReason,
  recordPurchaseFromCheckoutSession,
  revokePurchaseByPaymentIntent,
  type RecordPurchaseResult,
} from "./purchases";
import { getStripe } from "./stripe";

/**
 * Stripe Webhook の各イベントの処理
 * Webhook処理
 *
 * 受け口（`api/stripe/webhook/route.ts`）は署名検証と重複排除だけを行い、
 * 中身の処理はここに置く。どの処理も **payload の状態をそのまま書かず**、
 * Stripe から現在値を取り直してから書く。イベントは順不同で届きうるので、
 * 届いた時点の古い状態で上書きしない。
 *
 * 回復不能な見送り（知らない価格・未登録の顧客）は結果として返し、受け口は
 * 200 を返す。500 で再送させ続けるとエンドポイントのエラー率が上がり、
 * Stripe 側で無効化されうる。投げるのは DB 障害など一時的な失敗だけ。
 */

/**
 * `checkout.session.completed` — 購入を記録する
 * Checkout完了処理
 *
 * `line_items` は payload に載らないので、展開して取り直す。
 */
export async function handleCheckoutSessionCompleted(
  sessionId: string,
): Promise<RecordPurchaseResult> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });
  const result = await recordPurchaseFromCheckoutSession(session);
  if (result.outcome === "ignored") {
    logExternalError(
      "stripe-webhook",
      `checkout.session.completed ignored (${result.reason}) for ${sessionId}`,
      undefined,
    );
  }
  return result;
}

/** `charge.refunded` の処理結果 */
export type ChargeRefundedResult =
  | { readonly outcome: "revoked" }
  | { readonly outcome: "partialRefund" }
  | { readonly outcome: "noPaymentIntent" }
  | { readonly outcome: "notFound" };

/**
 * `charge.refunded` — 全額返金なら特典を取り消す
 * 返金処理
 *
 * 部分返金は取り消さない（運用者が意図して一部だけ返した場合）。Charge は
 * 取り直して現在の `amount_refunded` で判定する。
 */
export async function handleChargeRefunded(
  chargeId: string,
): Promise<ChargeRefundedResult> {
  const charge = await getStripe().charges.retrieve(chargeId);
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return { outcome: "noPaymentIntent" };

  if (charge.amount_refunded < charge.amount) {
    return { outcome: "partialRefund" };
  }

  const revoked = await revokePurchaseByPaymentIntent(
    paymentIntentId,
    PurchaseRevokeReason.Refunded,
  );
  return { outcome: revoked ? "revoked" : "notFound" };
}

/**
 * 購読イベントを振り分ける
 * イベント振り分け
 *
 * `Stripe.Event` は `type` で判別できるユニオンなので、`switch` で絞れば
 * `event.data.object` の型が決まる（型アサーション不要）。
 */
export async function dispatchStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object.id);
      return;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object.id);
      return;
    default:
      // 購読していないイベント（Dashboard で手で足した場合など）は無視する
      return;
  }
}
