import { eq } from "drizzle-orm";
import "server-only";

import {
  db,
  profiles,
  stripeCustomers,
  type TransactionClient,
} from "@/lib/db";

import { getStripe } from "./stripe";

/**
 * ユーザーに対応する Stripe の顧客 ID を取得する。無ければ undefined
 * Stripe顧客取得
 */
export async function getStripeCustomerId(
  userId: string,
  client: Pick<TransactionClient, "select"> = db,
): Promise<string | undefined> {
  const [row] = await client
    .select({ stripeCustomerId: stripeCustomers.stripeCustomerId })
    .from(stripeCustomers)
    .where(eq(stripeCustomers.userId, userId))
    .limit(1);
  return row?.stripeCustomerId;
}

/**
 * ユーザーに対応する Stripe の顧客 ID を取得し、無ければ作る
 * Stripe顧客取得または作成
 *
 * Checkout の直前に呼ぶ。顧客を先に作って `customer` として渡すことで、
 * 購入の所有者を `stripe_customers` だけで判定できる（`purchases.ts` 参照）。
 *
 * @design 競合は Stripe の idempotency key で吸収する
 *
 * 同じユーザーが Checkout ボタンを連打すると、この関数が並行して走る。
 * `customers.create` に `customer:<userId>` を idempotency key として渡すと、
 * Stripe は 2 回目以降に同じ顧客を返すので、孤児の顧客が生まれない。
 * DB 側は `user_id` の UNIQUE に任せ、衝突した側は勝った行を読み直す。
 *
 * @param email - Stripe の顧客に控えるメール（領収書の送り先）。無ければ省略
 */
export async function getOrCreateStripeCustomerId(
  userId: string,
  email: string | undefined,
): Promise<string> {
  return db.transaction(async (tx) => {
    // 退会処理もこの行を先にロックし、顧客を消して deletedAt を記録する。
    // 進行中の認証済みリクエストが退会後に顧客対応を作り直すことを防ぐ。
    const [profile] = await tx
      .select({ deletedAt: profiles.deletedAt })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .for("update");
    if (profile?.deletedAt)
      throw new Error("Deleted user cannot start checkout");
    const existing = await getStripeCustomerId(userId, tx);
    if (existing) return existing;

    const customer = await getStripe().customers.create(
      { email, metadata: { supabaseUserId: userId } },
      { idempotencyKey: `customer:${userId}` },
    );

    const inserted = await tx
      .insert(stripeCustomers)
      .values({ userId, stripeCustomerId: customer.id })
      .onConflictDoNothing({ target: stripeCustomers.userId })
      .returning({ stripeCustomerId: stripeCustomers.stripeCustomerId });

    if (inserted.length > 0) return customer.id;

    // 並行した別のリクエストが先に入れた。idempotency key のおかげで
    // 通常は同じ顧客 ID だが、念のため DB の行を正とする。
    const winner = await getStripeCustomerId(userId, tx);
    if (!winner) throw new Error("Billing customer disappeared");
    return winner;
  });
}
