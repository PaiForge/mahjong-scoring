import "server-only";

import { and, asc, eq, isNotNull, isNull, lt, or, sql } from "drizzle-orm";

import { purgeLeaderboardCache } from "@/lib/cache-tags";
import {
  accountDeletions,
  benefitGrants,
  challengeAttempts,
  challengeBestScores,
  challengeResults,
  db,
  expEvents,
  lessonCompletions,
  notifications,
  practiceQuotaUsage,
  profiles,
  purchases,
  stripeCustomers,
  userExp,
  userRanks,
  userRoles,
  type AccountDeletion,
} from "@/lib/db";
import { revokeAppleLinkForDeletion } from "@/lib/apple/refresh-tokens";
import { logExternalError } from "@/lib/log-error";
import { createAdminClient } from "@/lib/supabase/admin";

import { lockAccountForDeletion } from "./account-write-lock";

/**
 * 退会の進み具合
 *
 * - `pending` — 受け付けたが、まだ終わっていない工程がある（サーバーが再開する）
 * - `completed` — 全工程を終えた
 */
export type AccountDeletionStatus = "pending" | "completed";

/**
 * 処理の貸し出しの長さ。その場の処理と cron が同じ要求を同時に進めない
 * ための目安で、どの工程もこれより十分短い。切れて二重に走っても、
 * 工程はどれも冪等なので結果は変わらない。
 */
const PROCESSING_LEASE_MS = 2 * 60 * 1000;

/** cron が 1 回に進める要求の数。関数の実行時間に収める */
const CRON_BATCH_SIZE = 20;

/**
 * 退会を受け付け、その場で処理を進める
 * 退会受付
 *
 * @description
 * 退会は「受け付けた時点で約束が成立し、サーバーが最後まで終わらせる」
 * 処理として扱う。受付で `account_deletions` に行を作り、以降の書き込みを
 * 止めてから、工程（{@link processAccountDeletion}）をその場で 1 度進める。
 * 外部サービス（Storage・Auth）の一時障害で終わらなかった工程は cron が
 * 再開する — 本人のログインにも、アプリを開き続けていることにも頼らない
 * （Auth を無効化した後はログインできないので、本人にやり直させる設計は
 * 成り立たない）。
 *
 * 受付は冪等: 2 度目以降は行を作り直さず、今の進み具合を返す（成功の
 * 応答を失った端末が送り直しても二重に処理しない）。
 *
 * 方針（何を消し、何を残すか）:
 * - `auth.users` はソフトデリート（ログイン不可化）。`profiles`(RESTRICT) と
 *   `moderation_actions`(RESTRICT) が参照するため物理削除はできず、また username 保持・
 *   監査ログ保持の足場として残す。
 * - `profiles` は行を残し、個人情報を NULL 化して `deletedAt` を記録する
 *   （username は再利用防止のため保持）。
 * - 成績・経験値・学習履歴・段級位・ロール・途中のチャレンジ・通知は物理削除する
 *   （ランキングからも消える）。購入・顧客対応・手動付与・無料枠も同じ
 *   トランザクションで明示的に削除する。auth.users のソフトデリートでは
 *   CASCADE しない。購入手続きは顧客対応の削除に CASCADE する。Stripe の
 *   決済記録は残し、返金はしない。利用規約の「退会」の節がこの一覧を約束して
 *   いるので、消す対象を増減したら規約の文面（`terms.deletion`）も合わせて直すこと。
 * - `user_activity_log` / `moderation_actions` / `account_deletions` は監査のため保持する。
 * - アバター画像は Storage から削除する。失敗したら再試行する。
 * - Apple でログインしたことがあれば、Apple 側の連携を取り消す
 *   （`apple_refresh_tokens`）。失敗したら再試行し、取り消すまで完了にしない。
 *
 * @param userId - 本人確認を済ませたユーザーの ID
 */
export async function requestAccountDeletion(
  userId: string,
): Promise<AccountDeletionStatus> {
  await db.transaction(async (tx) => {
    // 共有ロックを持って書いている途中の書き込みが終わるのを待ってから
    // 要求を書く。以降の書き込みはこの行を見て止まる（account-write-lock.ts）
    await lockAccountForDeletion(tx, userId);
    await tx.insert(accountDeletions).values({ userId }).onConflictDoNothing();
  });
  return processAccountDeletion(userId);
}

/**
 * 退会の工程を、終わっていないものから進める
 * 退会処理
 *
 * 工程は「DB のデータ削除 → Storage の削除 → Auth の無効化 → Apple の連携の
 * 取り消し」の順で、終えたものは時刻を記録して飛ばす。Apple の取り消しを
 * 最後に置くのは、Apple の障害や設定の不備でデータの削除とログインの無効化を
 * 止めないため。どれかが失敗したらそこで止め、理由を
 * 記録して `pending` を返す（次の試行がそこから続ける）。
 *
 * 他の処理（その場の処理と cron）が貸し出しを持っている間は何もせず、
 * 今の進み具合だけを返す。
 */
export async function processAccountDeletion(
  userId: string,
): Promise<AccountDeletionStatus> {
  const leased = await leaseDeletion(userId);
  if (!leased) return (await getAccountDeletionStatus(userId)) ?? "pending";

  try {
    if (!leased.dataDeletedAt) {
      await deleteAccountData(userId);
      await markStep(userId, { dataDeletedAt: new Date() });
    }
    if (!leased.storageDeletedAt) {
      await deleteAvatarFiles(userId);
      await markStep(userId, { storageDeletedAt: new Date() });
    }
    if (!leased.authDeletedAt) {
      await softDeleteAuthUser(userId);
      await markStep(userId, { authDeletedAt: new Date() });
    }
    // 済みの記録は取り消しの側が書く（保存と競合しないよう行をロックして）
    if (!leased.appleRevokedAt) await revokeAppleLinkForDeletion(userId);
    return await markCompleted(userId);
  } catch (error) {
    logExternalError("processAccountDeletion", "deletion step failed", error);
    await markStep(userId, {
      // 貸し出しを返し、次の試行（cron）がすぐ拾えるようにする
      lastAttemptAt: null,
      lastError: error instanceof Error ? error.message : String(error),
    });
    return "pending";
  }
}

/**
 * 終わっていない退会を古いものから進める（cron 用）
 * 退会の再開
 *
 * @returns 進めた要求の数と、そのうち完了した数
 */
export async function processPendingAccountDeletions(): Promise<{
  readonly processed: number;
  readonly completed: number;
}> {
  const pending = await db
    .select({ userId: accountDeletions.userId })
    .from(accountDeletions)
    .where(isNull(accountDeletions.completedAt))
    .orderBy(asc(accountDeletions.requestedAt))
    .limit(CRON_BATCH_SIZE);
  let completed = 0;
  for (const { userId } of pending) {
    if ((await processAccountDeletion(userId)) === "completed") completed++;
  }
  return { processed: pending.length, completed };
}

/**
 * 退会の進み具合を読む。退会を受け付けていなければ undefined
 * 退会状態取得
 */
export async function getAccountDeletionStatus(
  userId: string,
): Promise<AccountDeletionStatus | undefined> {
  const [row] = await db
    .select({ completedAt: accountDeletions.completedAt })
    .from(accountDeletions)
    .where(eq(accountDeletions.userId, userId))
    .limit(1);
  if (!row) return undefined;
  return row.completedAt ? "completed" : "pending";
}

/**
 * 処理の貸し出しを取る。取れたら要求の行（どの工程が済んでいるか）を返す
 *
 * 完了済み・他の処理が貸し出し中なら undefined。1 文の UPDATE で
 * 取るので、同時に取りに来ても片方だけが取れる。
 */
async function leaseDeletion(
  userId: string,
): Promise<AccountDeletion | undefined> {
  const leaseExpiredBefore = new Date(Date.now() - PROCESSING_LEASE_MS);
  const [row] = await db
    .update(accountDeletions)
    .set({
      lastAttemptAt: new Date(),
      attempts: sql`${accountDeletions.attempts} + 1`,
    })
    .where(
      and(
        eq(accountDeletions.userId, userId),
        isNull(accountDeletions.completedAt),
        or(
          isNull(accountDeletions.lastAttemptAt),
          lt(accountDeletions.lastAttemptAt, leaseExpiredBefore),
        ),
      ),
    )
    .returning();
  return row;
}

/**
 * 全工程を終えたことを記録する
 *
 * 退会の受付の後に Apple のトークンが届くと、保存した側が Apple の工程を
 * 未了へ戻す（`lib/apple/refresh-tokens.ts`）。その直後に完了を書いて
 * しまわないよう、Apple の工程が済んでいるときだけ書く。書けなければ
 * 貸し出しを返して `pending`（cron が取り消しからやり直す）。
 */
async function markCompleted(userId: string): Promise<AccountDeletionStatus> {
  const [completed] = await db
    .update(accountDeletions)
    .set({ completedAt: new Date(), lastAttemptAt: null, lastError: null })
    .where(
      and(
        eq(accountDeletions.userId, userId),
        isNotNull(accountDeletions.appleRevokedAt),
      ),
    )
    .returning({ userId: accountDeletions.userId });
  if (completed) return "completed";
  await markStep(userId, { lastAttemptAt: null });
  return "pending";
}

/** 工程の完了などを要求の行に書く */
async function markStep(
  userId: string,
  values: Partial<
    Pick<
      AccountDeletion,
      | "dataDeletedAt"
      | "storageDeletedAt"
      | "authDeletedAt"
      | "lastAttemptAt"
      | "lastError"
    >
  >,
): Promise<void> {
  await db
    .update(accountDeletions)
    .set(values)
    .where(eq(accountDeletions.userId, userId));
}

/**
 * DB の行動データを物理削除し、プロフィールを username を残して匿名化する
 * （1 トランザクション。何度実行しても同じ結果）
 */
async function deleteAccountData(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // 顧客対応の作成もこのプロフィールの行をロックする（billing/customer.ts）。
    // 進行中の Checkout の作成が終わるのを待ってから顧客を消す。
    await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .for("update");
    // 購入記録側がロックする顧客を先に消す。進行中の購入の COMMIT を待ってから
    // 購入行を消すので、削除の途中で新しい購入だけが残ることがない。
    await tx.delete(stripeCustomers).where(eq(stripeCustomers.userId, userId));
    await tx.delete(purchases).where(eq(purchases.userId, userId));
    await tx.delete(benefitGrants).where(eq(benefitGrants.userId, userId));
    await tx
      .delete(practiceQuotaUsage)
      .where(eq(practiceQuotaUsage.userId, userId));
    await tx
      .delete(challengeBestScores)
      .where(eq(challengeBestScores.userId, userId));
    await tx
      .delete(challengeResults)
      .where(eq(challengeResults.userId, userId));
    await tx.delete(expEvents).where(eq(expEvents.userId, userId));
    await tx.delete(userExp).where(eq(userExp.userId, userId));
    await tx
      .delete(lessonCompletions)
      .where(eq(lessonCompletions.userId, userId));
    await tx.delete(userRanks).where(eq(userRanks.userId, userId));
    await tx.delete(userRoles).where(eq(userRoles.userId, userId));
    await tx
      .delete(challengeAttempts)
      .where(eq(challengeAttempts.userId, userId));
    await tx.delete(notifications).where(eq(notifications.userId, userId));

    await tx
      .update(profiles)
      .set({
        displayName: null,
        avatarUrl: null,
        bio: null,
        xUsername: null,
        instagramUsername: null,
        youtubeHandle: null,
        // やり直しのときは最初に退会した時刻を残す
        deletedAt: sql`coalesce(${profiles.deletedAt}, now())`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId));
  });

  // 成績を消しても、ランキングのキャッシュ（5 分）には退会者の行が残る。
  // しかもアバターの実体は直後に消えるため、捨てないと数分間「退会者の名前と
  // 割れた画像」が一覧に出る。
  purgeLeaderboardCache();
}

/** アバター画像を Storage から消す。失敗は投げて再試行に回す */
async function deleteAvatarFiles(userId: string): Promise<void> {
  const bucket = createAdminClient().storage.from("avatars");
  const { data: files, error: listError } = await bucket.list(userId);
  if (listError) throw new Error(`storage list: ${listError.message}`);
  if (!files?.length) return;
  const { error: removeError } = await bucket.remove(
    files.map((f) => `${userId}/${f.name}`),
  );
  if (removeError) throw new Error(`storage remove: ${removeError.message}`);
}

/**
 * Auth をソフトデリートする（ログインできなくする）。失敗は投げて再試行に回す
 *
 * 既に消えている（前の試行で消えた後、完了の記録だけが失敗した）なら成功として扱う。
 *
 * ソフトデリートは `auth.users` の email と、`auth.identities` の
 * `provider_id`（Apple・Google のユーザー ID、メールなら email）を読めない値に
 * 置き換え、`identity_data` を空にする（行は残る。2026-10 にローカルで実測）。
 * そのため同じ Apple ID・メールで登録し直すと、新しいユーザー ID として始まり、
 * 旧データには繋がらない。
 */
async function softDeleteAuthUser(userId: string): Promise<void> {
  const { error } = await createAdminClient().auth.admin.deleteUser(
    userId,
    true,
  );
  if (!error) return;
  if (error.status === 404) return;
  throw new Error(`auth delete: ${error.message}`);
}
