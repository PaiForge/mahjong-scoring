import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import "server-only";
import {
  purchases,
  stripeCustomers,
  type Purchase,
  type TransactionClient,
} from "@/lib/db";

/**
 * 未取消で、期限内または永久の購入を読む。開始待ち（`starts_at` が未来）も含む
 * 未失効の購入取得
 *
 * App Store の Sandbox の購入は数えない（テスターが買い直して試せるように）。
 * `apple_environment` は Stripe の行で NULL なので、`<>` ではなく
 * `IS DISTINCT FROM` で NULL を残す。
 *
 * 追加購入の禁止（{@link hasUnexpiredPurchase}）と、App Store から届いた
 * 2 枚目のパスの開始日（`apple/record.ts`）が同じ条件で読む。画面側の同じ規則は
 * `plan-status.ts` の `blocksNewPurchase`。条件を変えるときは両方を揃える
 */
export async function findUnexpiredPurchases(
  tx: TransactionClient,
  userId: string,
  now: Date,
): Promise<
  readonly Pick<Purchase, "id" | "kind" | "startsAt" | "expiresAt">[]
> {
  return tx
    .select({
      id: purchases.id,
      kind: purchases.kind,
      startsAt: purchases.startsAt,
      expiresAt: purchases.expiresAt,
    })
    .from(purchases)
    .where(
      and(
        eq(purchases.userId, userId),
        isNull(purchases.revokedAt),
        or(isNull(purchases.expiresAt), gt(purchases.expiresAt, now)),
        sql`${purchases.appleEnvironment} IS DISTINCT FROM 'Sandbox'`,
      ),
    );
}

/**
 * 未取消で、期限内または永久の購入があるか。旧実装の開始待ちも再販売しない。
 * 追加購入の禁止
 *
 * 条件は {@link findUnexpiredPurchases}（Sandbox の購入は数えない）。
 */
export async function hasUnexpiredPurchase(
  tx: TransactionClient,
  userId: string,
  now: Date,
): Promise<boolean> {
  return (await findUnexpiredPurchases(tx, userId, now)).length > 0;
}

/** 顧客行のロック。購入記録と手続き作成は常に顧客 → PaymentIntent の順で取る。 */
export async function lockBillingCustomer(
  tx: TransactionClient,
  customerId: string,
) {
  const [customer] = await tx
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.stripeCustomerId, customerId))
    .for("update");
  return customer;
}
