import type { BillingCheckout } from "@/lib/db";

/** 予約の有効期間。Stripe の許容範囲（30分〜24時間）内で、再試行の余裕を残す。 */
const RESERVATION_SECONDS = 60 * 60;
/** Stripe が Checkout Session の作成時に要求する残り時間 */
const SESSION_MIN_REMAINING_MS = 30 * 60 * 1000;

/**
 * 新しく作る購入手続きの予約の期限
 *
 * Session の `expires_at` にそのまま渡すため秒に切り捨てる。
 */
export function reservationExpiresAt(now: Date): Date {
  return new Date(
    (Math.floor(now.getTime() / 1000) + RESERVATION_SECONDS) * 1000,
  );
}

/**
 * 予約がもう Session を作れないほど期限に近いか
 *
 * Session ID が保存済みなら URL は渡してあり、Stripe 側の Session の状態に
 * 従う（ここでは失効させない）。未保存なら Session はまだ無く、Stripe は
 * 作成時に残り 30 分以上を要求するので、それを切っていれば失効扱いにする。
 */
export function isReservationTooLateForSession(
  attempt: Pick<BillingCheckout, "stripeCheckoutSessionId" | "expiresAt">,
  now: Date,
): boolean {
  return (
    !attempt.stripeCheckoutSessionId &&
    attempt.expiresAt.getTime() <= now.getTime() + SESSION_MIN_REMAINING_MS
  );
}
