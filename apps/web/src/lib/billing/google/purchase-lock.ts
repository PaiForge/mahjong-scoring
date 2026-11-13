import { sql } from "drizzle-orm";
import "server-only";

import type { TransactionClient } from "@/lib/db";

/**
 * 購入の記録を Google Play の購入トークンごとに直列化する
 * 購入ロック（Google Play）
 *
 * アプリの購入直後の送信と起動時の送り直しが同じ購入を同時に記録しようと
 * する。App Store の取引ロック（`apple/transaction-lock.ts`）と同じく、
 * トランザクションの終わりで外れる advisory lock を取る。ユーザーの書き込み
 * ロック（`lockAccountForWrite`）は必ずこの後に取る（順序を揃えて互いに
 * 待ち合わない）。
 */
export async function lockGooglePurchase(
  tx: TransactionClient,
  purchaseToken: string,
): Promise<void> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`google-purchase:${purchaseToken}`}, 0))`,
  );
}
