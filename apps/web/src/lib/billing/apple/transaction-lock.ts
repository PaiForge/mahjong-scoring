import { sql } from "drizzle-orm";
import "server-only";

import type { TransactionClient } from "@/lib/db";

/**
 * 購入の記録と取り消し・戻しを App Store の取引ごとに直列化する
 * 取引ロック
 *
 * アプリからの送信・復元・ONE_TIME_CHARGE 通知が同じ取引を同時に記録しようと
 * したり、REFUND 通知が記録と同時に届いたりする。Stripe の PaymentIntent の
 * ロック（`purchases.ts`）と同じく、トランザクションの終わりで外れる
 * advisory lock を取る。ユーザーの書き込みロック（`lockAccountForWrite`）は
 * 必ずこの後に取る（順序を揃えて互いに待ち合わない）。
 */
export async function lockAppleTransaction(
  tx: TransactionClient,
  transactionId: string,
): Promise<void> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`apple-transaction:${transactionId}`}, 0))`,
  );
}
