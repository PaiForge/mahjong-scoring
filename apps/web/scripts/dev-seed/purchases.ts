/**
 * ローカル開発用の購入記録（有料プラン）の投入
 * 購入シード
 *
 * マイページのプラン表示・購入履歴と、回数制限や拡張機能の出し分けを
 * ログインするだけで確認できるよう、`purchases` に偽の Stripe ID を持つ行を
 * 入れる。Stripe API は叩かない。
 *
 * - bob   — 有効な 30 日パス 1 枚（10 日前に購入）と、その前に使い切った
 *           パス 1 枚（履歴に「期限切れ」が並ぶ状態）
 * - carol — 買い切り（永久）
 * - alice — 購入なし（無料枠の回数制限が掛かる状態）
 *
 * `stripe_customers` には入れない。偽の顧客 ID を置くと、シードユーザーで
 * Checkout を試したときに Stripe 側に存在しない顧客を渡して失敗する。
 * 購入の記録に顧客対応は要らないので、無い方が Checkout の動作確認まで
 * 一貫してできる。
 *
 * 宣言した状態へ消して入れ直す（チャレンジ成績と同じ方針）。シードユーザー
 * として実際に購入した記録は次の実行で消える。
 */
import { inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import {
  PLANS,
  PurchaseKind,
  addPassDuration,
} from "@mahjong-scoring/features/billing/plans";
import { purchases, type NewPurchase } from "../../src/lib/db/schema";

/** 投入先のユーザー（`ensureSeedUser` が返した id と username） */
export interface PurchaseSeedUser {
  readonly userId: string;
  readonly username: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

/** 偽の Stripe ID。接頭辞は本物に合わせ、`seed` を含めて見分けられるようにする */
function fakeIds(username: string, n: number) {
  return {
    stripeCheckoutSessionId: `cs_seed_${username}_${n}`,
    stripePaymentIntentId: `pi_seed_${username}_${n}`,
  };
}

function passRow(
  userId: string,
  username: string,
  n: number,
  startsAt: Date,
): NewPurchase {
  const plan = PLANS.pro;
  const offer = plan.offers.pass;
  if (offer.kind !== PurchaseKind.Pass) {
    throw new Error("pro.offers.pass はパスであるべき");
  }
  return {
    userId,
    plan: plan.key,
    kind: offer.kind,
    benefits: [...plan.benefits],
    ...fakeIds(username, n),
    currency: "jpy",
    amount: 480,
    startsAt,
    expiresAt: addPassDuration(startsAt, offer.durationDays),
    createdAt: startsAt,
  };
}

function lifetimeRow(
  userId: string,
  username: string,
  n: number,
  startsAt: Date,
): NewPurchase {
  const plan = PLANS.pro;
  return {
    userId,
    plan: plan.key,
    kind: plan.offers.lifetime.kind,
    benefits: [...plan.benefits],
    ...fakeIds(username, n),
    currency: "jpy",
    amount: 1480,
    startsAt,
    expiresAt: undefined,
    createdAt: startsAt,
  };
}

/** username → 投入する行を作る関数 */
const PURCHASES_BY_USERNAME: Readonly<
  Record<string, (userId: string, now: Date) => readonly NewPurchase[]>
> = {
  seed_bob: (userId, now) => [
    passRow(userId, "seed_bob", 1, daysAgo(now, 50)),
    passRow(userId, "seed_bob", 2, daysAgo(now, 10)),
  ],
  seed_carol: (userId, now) => [
    lifetimeRow(userId, "seed_carol", 1, daysAgo(now, 30)),
  ],
};

/**
 * シードユーザーの購入記録を宣言どおりに入れ直す
 * 購入再投入
 *
 * @returns 投入した行数
 */
export async function reseedPurchases(
  db: PostgresJsDatabase,
  users: readonly PurchaseSeedUser[],
  now: Date = new Date(),
): Promise<number> {
  const userIds = users.map((user) => user.userId);
  if (userIds.length === 0) return 0;

  const rows = users.flatMap(
    (user) => PURCHASES_BY_USERNAME[user.username]?.(user.userId, now) ?? [],
  );

  await db.transaction(async (tx) => {
    await tx.delete(purchases).where(inArray(purchases.userId, userIds));
    if (rows.length > 0) await tx.insert(purchases).values([...rows]);
  });

  return rows.length;
}
