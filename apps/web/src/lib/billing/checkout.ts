import { and, eq, isNull } from "drizzle-orm";
import "server-only";

import { billingCheckouts, db, type TransactionClient } from "@/lib/db";
import {
  checkoutSessionOutcome,
  checkoutSessionParams,
} from "./checkout-session";
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
  type OfferKey,
} from "@mahjong-scoring/features/billing/plans";
import { recordPurchaseFromCheckoutSession } from "./purchases";
import { getStripe } from "./stripe";
import { logExternalError } from "@/lib/log-error";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * 購入手続きの拒否理由。販売中のパスも買い切りも追加購入させない。
 * `checkoutExpired` は失効した（または売り方の切り替えで失効させた）手続きの
 * 置き換えが {@link MAX_RESERVATION_ATTEMPTS} 回続いた場合だけ返る（通常は
 * 同じ呼び出しの中で新しい手続きに置き換わる）。`checkoutInProgress` は別の
 * 売り方の Session を失効させられなかった場合だけ返る。
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
 * 別の売り方の手続きがある場合は、その Session を Stripe で失効させてから
 * 新しい売り方の予約に置き換える（下の「失効」と同じやり直しに乗る）。
 *
 * @design 売り方の切り替えは Session を失効させて行う
 * 以前は「先に選んだボタンから再開してください」と案内するだけで、別の売り方を
 * 買うには予約の期限（1 時間）を待つしかなかった。パスの画面を開いて戻り、
 * 買い切りを押し直すのは自然な操作で、1 時間待たせる理由は利用者側に無い。
 * 失効（`checkout.sessions.expire`）は開いている Session にしか効かず、失効した
 * Session は支払えない。そのため失効が成功した時点で古い Session の決済は
 * 起こり得ず、二重決済にならない。失効が失敗したら（その間に支払いが完了した・
 * 決済の処理中・通信の失敗）切り替えず `checkoutInProgress` を返す — 支払い済み
 * なら Webhook か着地が記録し、次に押すと `alreadyActive` になる。通信の失敗で
 * 実は失効していた場合も、次に押せば `expired` として置き換わる。
 *

 * 予約が失効していた（Stripe 側で Session が期限切れ、または ID 未発行のまま
 * 期限が迫った）場合は精算して、同じ呼び出しの中で新しい予約からやり直す。
 * 「期限が切れました。もう一度押してください」を 1 回挟む理由が利用者側に
 * 無いため。やり直しでも購入可否（有効な購入の有無）は予約・発行の両方の
 * トランザクションで改めて確かめる
 *
 * `locale` は押した画面の UI の言語で、新しい予約に保存する。Checkout の
 * `locale`・`cancel_url`・完了の着地の言語は予約の値から組む（呼び出し時の
 * 値を Session のパラメータに直接使わない。再試行は予約から再生成する契約）。
 * 未精算の予約を再利用するときは言語を問わずそれを返す — 別の言語で押し
 * 直しても予約の言語の Session になる。冪等パラメータを変えないため。
 * 予約の期限（1 時間）が切れれば新しい予約で新しい言語になる。
 *
 * @param locale - 押した画面の UI の言語。省略時は日本語（既存の呼び出しの挙動）
 */
export async function openCheckout(
  userId: string,
  email: string | undefined,
  offerKey: OfferKey,
  origin: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<{ readonly url: string } | { readonly error: CheckoutError }> {
  const customerId = await getOrCreateStripeCustomerId(userId, email);
  for (let attempt = 1; ; attempt++) {
    const result = await reserveAndActivate(
      userId,
      customerId,
      offerKey,
      origin,
      locale,
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
  locale: SupportedLocale,
): Promise<
  | { readonly url: string; readonly error?: undefined }
  | { readonly error: CheckoutError; readonly url?: undefined }
> {
  const reserved = await db.transaction(async (tx) => {
    const gate = await lockCustomerWithoutActivePurchase(
      tx,
      customerId,
      userId,
    );
    if ("error" in gate) return gate;
    const { customer, now } = gate;
    const [pending] = await tx
      .select()
      .from(billingCheckouts)
      .where(
        and(
          eq(billingCheckouts.customerId, customer.id),
          isNull(billingCheckouts.settledAt),
        ),
      );
    // 未精算の予約は言語が違っても再利用する（予約の言語の Session のまま）
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
        locale,
        expiresAt: reservationExpiresAt(now),
      })
      .returning();
    if (!created) throw new Error("Checkout reservation failed");
    return created;
  });
  if ("error" in reserved) return reserved;

  const result = await db.transaction(async (tx) => {
    const gate = await lockCustomerWithoutActivePurchase(
      tx,
      customerId,
      userId,
    );
    if ("error" in gate) return gate;
    const { now } = gate;
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
          checkoutSessionParams(attempt, customerId),
          { idempotencyKey: `checkout:${attempt.id}` },
        );
    await tx
      .update(billingCheckouts)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(billingCheckouts.id, attempt.id));
    const outcome = checkoutSessionOutcome(session, attempt, offerKey);
    switch (outcome.kind) {
      case "expired":
        await settle(tx, attempt.id);
        return { error: "checkoutExpired" } as const;
      case "completed":
        return { completed: session } as const;
      case "otherOffer":
        if (!(await expireOpenSession(stripe, session.id)))
          return { error: "checkoutInProgress" } as const;
        await settle(tx, attempt.id);
        return { error: "checkoutExpired" } as const;
      case "missingUrl":
        throw new Error("Checkout has no URL");
      case "redirect":
        return { url: outcome.url };
      default: {
        const exhaustive: never = outcome;
        return exhaustive;
      }
    }
  });
  if ("completed" in result && result.completed) {
    // ロックを解放してから同じ購入記録関数へ。Webhook が遅れていても回復する。
    await recordPurchaseFromCheckoutSession(result.completed);
    return { error: "checkoutPending" };
  }
  if ("url" in result && result.url) return { url: result.url };
  return { error: result.error ?? "checkoutPending" };
}

/**
 * 顧客の行をロックし、有効な購入が無いことを確かめる（予約と発行の両方の入口）
 *
 * ロックは同じ顧客の同時の Checkout を直列にするため。有効な購入があれば
 * ロックしたまま `alreadyActive` で抜ける（トランザクションの終了で解放される）。
 * 顧客の行が無いのは呼び出し側が作った直後に消えたときだけなので例外にする。
 */
async function lockCustomerWithoutActivePurchase(
  tx: TransactionClient,
  customerId: string,
  userId: string,
): Promise<
  | {
      readonly customer: NonNullable<
        Awaited<ReturnType<typeof lockBillingCustomer>>
      >;
      readonly now: Date;
    }
  | { readonly error: "alreadyActive" }
> {
  const customer = await lockBillingCustomer(tx, customerId);
  if (!customer) throw new Error("Billing customer no longer exists");
  const now = new Date();
  if (await hasUnexpiredPurchase(tx, userId, now))
    return { error: "alreadyActive" } as const;
  return { customer, now };
}

/**
 * 開いている Checkout Session を Stripe で失効させる
 * Session 失効
 *
 * 失効できたら true。支払い済み・決済の処理中・通信の失敗など、失効を確かめ
 * られなければ false（例外にしない。呼び出し側は切り替えを諦めて案内を返す）。
 */
async function expireOpenSession(
  stripe: ReturnType<typeof getStripe>,
  sessionId: string,
): Promise<boolean> {
  try {
    const expired = await stripe.checkout.sessions.expire(sessionId);
    return expired.status === "expired";
  } catch (error) {
    logExternalError(
      "openCheckout",
      "failed to expire the other offer's Checkout session",
      error,
    );
    return false;
  }
}

async function settle(tx: TransactionClient, id: string): Promise<void> {
  await tx
    .update(billingCheckouts)
    .set({ settledAt: new Date() })
    .where(eq(billingCheckouts.id, id));
}
