import { and, eq, gt, isNull, or } from "drizzle-orm";
import "server-only";
import { purchases, stripeCustomers, type TransactionClient } from "@/lib/db";

/**
 * 未取消で、期限内または永久の購入があるか。旧実装の開始待ちも再販売しない。
 * 画面側の同じ規則は `plan-status.ts` の `blocksNewPurchase`。条件を変えるときは
 * 両方を揃える
 */
export async function hasUnexpiredPurchase(
  tx: TransactionClient,
  userId: string,
  now: Date,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: purchases.id })
    .from(purchases)
    .where(
      and(
        eq(purchases.userId, userId),
        isNull(purchases.revokedAt),
        or(isNull(purchases.expiresAt), gt(purchases.expiresAt, now)),
      ),
    )
    .limit(1);
  return row !== undefined;
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
