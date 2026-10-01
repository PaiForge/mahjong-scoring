import { and, desc, eq, gt, isNull } from "drizzle-orm";
import "server-only";
import type Stripe from "stripe";

import { db, purchases, stripeCustomers, type Purchase } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";

import { resolveOfferByPriceId } from "./env";
import { PLANS, PurchaseKind, addPassDuration, type PlanKey } from "./plans";

/**
 * 購入の記録と参照
 * 購入記録
 *
 * Checkout 完了の着地（Route Handler）と Webhook（`checkout.session.completed`）
 * の両方が {@link recordPurchaseFromCheckoutSession} を呼ぶ。どちらが先でも、
 * 両方同時でも、`stripe_checkout_session_id` の UNIQUE で 1 行にする。
 */

/** 取り消しの理由（`purchases.revoke_reason` の値） */
export const PurchaseRevokeReason = {
  Refunded: "refunded",
  Fraud: "fraud",
} as const;
export type PurchaseRevokeReason =
  (typeof PurchaseRevokeReason)[keyof typeof PurchaseRevokeReason];

/**
 * 記録を見送った理由
 * 購入記録見送り理由
 *
 * - `notPaid` — 支払いが完了していない（`payment_status !== "paid"`）か、一括払いでない
 * - `missingLineItems` — Session に `line_items` が展開されていない（呼び出し側の取得漏れ）
 * - `unknownPrice` — どの売り方の Price でもない。知らない価格に特典を付けない
 * - `unknownCustomer` — `stripe_customers` に無い顧客。Dashboard で手作業した決済など
 * - `missingPaymentIntent` — 一括払いなのに PaymentIntent が無い（想定外）
 */
export type PurchaseIgnoredReason =
  | "notPaid"
  | "missingLineItems"
  | "unknownPrice"
  | "unknownCustomer"
  | "missingPaymentIntent";

/** {@link recordPurchaseFromCheckoutSession} の結果 */
export type RecordPurchaseResult =
  | { readonly outcome: "recorded"; readonly purchaseId: string }
  | { readonly outcome: "duplicate" }
  | { readonly outcome: "ignored"; readonly reason: PurchaseIgnoredReason };

/** Stripe の「ID か展開済みオブジェクト」から ID を取り出す */
function idOf(
  value: string | { readonly id: string } | null | undefined,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  return typeof value === "string" ? value : value.id;
}

/**
 * 有効な期間パスのうち最も遅い期限を返す。無ければ undefined
 * パス期限取得
 *
 * 重ね買いの開始日時を決めるのに使う（{@link recordPurchaseFromCheckoutSession}）。
 */
async function findLatestActivePassExpiry(
  userId: string,
  plan: PlanKey,
  now: Date,
): Promise<Date | undefined> {
  const [row] = await db
    .select({ expiresAt: purchases.expiresAt })
    .from(purchases)
    .where(
      and(
        eq(purchases.userId, userId),
        eq(purchases.plan, plan),
        eq(purchases.kind, PurchaseKind.Pass),
        isNull(purchases.revokedAt),
        gt(purchases.expiresAt, now),
      ),
    )
    .orderBy(desc(purchases.expiresAt))
    .limit(1);
  return row?.expiresAt ?? undefined;
}

/**
 * Checkout Session から購入を記録する（冪等）
 * 購入記録
 *
 * 呼び出し側は `line_items` を展開した Session を渡すこと
 * （`checkout.sessions.retrieve(id, { expand: ["line_items"] })`）。
 * Webhook の payload には `line_items` が載らないので、Webhook 側も
 * 必ず取り直してから渡す — 届いた payload の状態をそのまま信じない。
 *
 * 所有者は `session.customer` を `stripe_customers` で引いて決める。
 * metadata の userId は使わない（根拠を 1 本に揃える）。
 *
 * @design 期間パスの重ね買いは後ろに繋ぐ
 *
 * 有効なパスを持つ人がもう 1 枚買ったら、新しいパスの開始は現在のパスの
 * 期限にする。残っている日数を捨てさせない。買い切りは常に即時開始。
 *
 * @param now - 判定の基準時刻。テストから差し替えるために引数にしている
 */
export async function recordPurchaseFromCheckoutSession(
  session: Stripe.Checkout.Session,
  now: Date = new Date(),
): Promise<RecordPurchaseResult> {
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return { outcome: "ignored", reason: "notPaid" };
  }

  const lineItem = session.line_items?.data[0];
  const priceId = lineItem?.price?.id;
  if (!lineItem || !priceId) {
    return { outcome: "ignored", reason: "missingLineItems" };
  }

  const resolved = resolveOfferByPriceId(priceId);
  if (!resolved) {
    logExternalError(
      "recordPurchase",
      `unknown price ${priceId} on session ${session.id}`,
      undefined,
    );
    return { outcome: "ignored", reason: "unknownPrice" };
  }

  const paymentIntentId = idOf(session.payment_intent);
  if (!paymentIntentId) {
    return { outcome: "ignored", reason: "missingPaymentIntent" };
  }

  const customerId = idOf(session.customer);
  const [customerRow] = customerId
    ? await db
        .select({ userId: stripeCustomers.userId })
        .from(stripeCustomers)
        .where(eq(stripeCustomers.stripeCustomerId, customerId))
        .limit(1)
    : [];
  if (!customerRow) {
    logExternalError(
      "recordPurchase",
      `no stripe_customers row for customer ${customerId ?? "(none)"} on session ${session.id}`,
      undefined,
    );
    return { outcome: "ignored", reason: "unknownCustomer" };
  }

  const plan = PLANS[resolved.plan];
  const offer = plan.offers[resolved.offer];

  let startsAt = now;
  let expiresAt: Date | undefined;
  if (offer.kind === PurchaseKind.Pass) {
    const currentExpiry = await findLatestActivePassExpiry(
      customerRow.userId,
      plan.key,
      now,
    );
    if (currentExpiry && currentExpiry > now) startsAt = currentExpiry;
    expiresAt = addPassDuration(startsAt, offer.durationDays);
  }

  const inserted = await db
    .insert(purchases)
    .values({
      userId: customerRow.userId,
      plan: plan.key,
      kind: offer.kind,
      benefits: [...plan.benefits],
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      currency: (session.currency ?? "jpy").toLowerCase(),
      amount: session.amount_total ?? 0,
      startsAt,
      expiresAt,
    })
    .onConflictDoNothing({ target: purchases.stripeCheckoutSessionId })
    .returning({ id: purchases.id });

  const row = inserted[0];
  return row
    ? { outcome: "recorded", purchaseId: row.id }
    : { outcome: "duplicate" };
}

/**
 * ユーザーの購入履歴（新しい順）。取り消した行も含む
 * 購入履歴取得
 *
 * 失敗したら空配列（履歴の欠落は「無い」と区別できないが、マイページが
 * 落ちるより良い）。ログは残す。
 */
export async function listPurchases(
  userId: string,
): Promise<readonly Purchase[]> {
  try {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.userId, userId))
      .orderBy(desc(purchases.createdAt));
  } catch (error) {
    logExternalError("listPurchases", "failed to list purchases", error);
    return [];
  }
}

/**
 * ユーザーが有効な買い切りを持っているか
 * 買い切り保持判定
 *
 * Checkout を作る前に見る。買い切りを持つ人にパスも買い切りも売らない
 * （二重購入の防止）。
 */
export async function hasActiveLifetimePurchase(
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(
      and(
        eq(purchases.userId, userId),
        eq(purchases.kind, PurchaseKind.Lifetime),
        isNull(purchases.revokedAt),
      ),
    )
    .limit(1);
  return row !== undefined;
}

/**
 * PaymentIntent から購入を取り消す。該当行が無いか既に取消済みなら false
 * 購入取り消し
 *
 * Webhook の `charge.refunded`（全額）から呼ぶ。行は消さず `revoked_at` を
 * 立てるだけ（購入履歴に「返金済み」として残す）。
 */
export async function revokePurchaseByPaymentIntent(
  paymentIntentId: string,
  reason: PurchaseRevokeReason,
  now: Date = new Date(),
): Promise<boolean> {
  const updated = await db
    .update(purchases)
    .set({ revokedAt: now, revokeReason: reason })
    .where(
      and(
        eq(purchases.stripePaymentIntentId, paymentIntentId),
        isNull(purchases.revokedAt),
      ),
    )
    .returning({ id: purchases.id });
  return updated.length > 0;
}
