import "server-only";

import { eq, sql } from "drizzle-orm";

import { accountDeletions, db, type TransactionClient } from "@/lib/db";

/**
 * ユーザー単位の advisory lock のキー
 *
 * 退会の受付（排他）と通常の書き込み（共有）が同じキーを取る。`hashtextextended`
 * は 64bit のハッシュで、別ユーザーのキーが衝突しても、互いを待つことがある
 * だけで正しさは崩れない。
 */
function accountLockKey(userId: string) {
  return sql`hashtextextended(${`account:${userId}`}, 0)`;
}

/**
 * 本人のデータを書く前に、退会と競合しないことを確かめる
 * 書き込み前の退会確認
 *
 * 書き込むトランザクションの中で、データを書く前に呼ぶ。ユーザー単位の
 * 共有ロックを取り、退会の要求（`account_deletions`）が無いことを確かめる。
 * false なら退会を受け付けた後なので、何も書かずに打ち切ること。
 *
 * @design 入口の確認だけでは足りない理由
 * 認証ゲートは要求の到着時に退会済みかを見るが、そこを通った後に退会が
 * 受け付けられ、データ削除が済んでから書き込みが走ると、消したはずの
 * データが残る。ロックは「退会の受付」と「書き込み」を直列にする:
 * 受付は排他ロックを取るので、共有ロックを持って書いている途中の
 * トランザクションが終わるまで待つ（その書き込みは後のデータ削除で消える）。
 * 受付の後に始まった書き込みは、共有ロックを取った時点で要求の行を見て止まる。
 *
 * ロックはトランザクションの終わりで外れる（`_xact_`）。共有ロック同士は
 * 待たないので、同じユーザーの書き込みが互いに詰まることはない。
 */
export async function lockAccountForWrite(
  tx: TransactionClient,
  userId: string,
): Promise<boolean> {
  await tx.execute(
    sql`select pg_advisory_xact_lock_shared(${accountLockKey(userId)})`,
  );
  const [pending] = await tx
    .select({ userId: accountDeletions.userId })
    .from(accountDeletions)
    .where(eq(accountDeletions.userId, userId))
    .limit(1);
  return pending === undefined;
}

/**
 * 本人のデータを、退会と競合しない形で書く
 * 退会と直列の書き込み
 *
 * トランザクションを開き、{@link lockAccountForWrite} を通ったときだけ
 * `write` を同じトランザクションで実行する。退会を受け付けた後なら
 * 何も書かずに `{ written: false }` を返す。
 */
export async function writeAsAccount<T>(
  userId: string,
  write: (tx: TransactionClient) => Promise<T>,
): Promise<
  { readonly written: true; readonly value: T } | { readonly written: false }
> {
  return db.transaction(async (tx) => {
    if (!(await lockAccountForWrite(tx, userId))) return { written: false };
    return { written: true, value: await write(tx) };
  });
}

/**
 * 退会の受付の前に、進行中の書き込みが終わるのを待つ
 * 退会受付のロック
 *
 * 受付のトランザクションの中で、要求の行を書く前に呼ぶ（{@link lockAccountForWrite}）。
 */
export async function lockAccountForDeletion(
  tx: TransactionClient,
  userId: string,
): Promise<void> {
  await tx.execute(
    sql`select pg_advisory_xact_lock(${accountLockKey(userId)})`,
  );
}
