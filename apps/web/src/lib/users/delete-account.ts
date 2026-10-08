import "server-only";

import { eq, sql } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { purgeLeaderboardCache } from "@/lib/cache-tags";

import {
  benefitGrants,
  challengeAttempts,
  notifications,
  purchases,
  practiceQuotaUsage,
  stripeCustomers,
  challengeBestScores,
  challengeResults,
  db,
  expEvents,
  lessonCompletions,
  profiles,
  userExp,
  userRanks,
  userRoles,
} from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * アカウント退会処理。
 *
 * @design 何度実行しても同じ結果になる処理を、Auth の削除を最後にして並べる
 *
 * 1. DB の行動データを消し、プロフィールを匿名化する（1 トランザクション）
 * 2. アバター画像を消す（ベストエフォート）
 * 3. Auth をソフトデリートする（ここでログインできなくなる）
 *
 * Auth を最後に置くのは、途中で失敗しても本人がまだログインできる状態を
 * 残すため。もう一度退会を押せば最初からやり直し、すでに消えたものは
 * 消し直すだけで済む。Auth を先に消すと、後半が失敗したとき本人は
 * ログインできず、再試行の手段が無くなる。削除の要求を記録して再開する
 * ジョブの表は持たない — どの段も冪等なので、本人の再実行がその代わりになる。
 *
 * 1 と 3 の間（3 が失敗したまま）でも書き込みを受け付けないよう、
 * 認証ゲート（`authenticateAndCheckBan` / アプリ向けの
 * `authenticateMobileRequest`）は `profiles.deleted_at` を見て退会済みを
 * 未認証として扱う。退会の Action だけがそれを素通しする。
 *
 * 方針:
 * - `auth.users` はソフトデリート（ログイン不可化）。`profiles`(RESTRICT) と
 *   `moderation_actions`(RESTRICT) が参照するため物理削除はできず、また username 保持・
 *   監査ログ保持の足場として残す。
 * - `profiles` は行を残し、個人情報を NULL 化して `deletedAt` を記録する
 *   （username は再利用防止のため保持）。
 * - 成績・経験値・学習履歴・段級位・ロールは物理削除する（ランキングからも消える）。
 *   購入・顧客対応・手動付与・無料枠も同じトランザクションで明示的に削除する。
 *   auth.users のソフトデリートでは CASCADE しない。購入手続きは顧客対応の
 *   削除に CASCADE する。Stripe の決済記録は残し、返金はしない。
 *   利用規約の「退会」の節がこの一覧を約束しているので、消す対象を増減
 *   したら規約の文面（`terms.deletion`）も合わせて直すこと。
 * - `user_activity_log` / `moderation_actions` は監査のため保持する。
 * - アバター画像は Storage から削除する（ベストエフォート）。
 *
 * アカウント退会
 */
/** 退会処理そのものの失敗理由 */
export type DeleteAccountError = "deleteFailed";

export async function deleteAccount(
  userId: string,
): Promise<ActionResult<DeleteAccountError>> {
  const adminClient = createAdminClient();

  // 1. 行動データを物理削除し、profiles は username を残して匿名化する（トランザクション）。
  await db.transaction(async (tx) => {
    // 顧客対応の作成も同じプロフィールを先にロックする。退会直後の再作成を防ぐ。
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

  // 2. アバター画像を Storage から削除（失敗しても退会は完了させる）。
  try {
    const { data: files } = await adminClient.storage
      .from("avatars")
      .list(userId);
    if (files?.length) {
      await adminClient.storage
        .from("avatars")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }
  } catch {
    // Storage 障害で退会をブロックしない。
  }

  // 3. 最後に auth ユーザーをソフトデリート（ログイン不可化）。失敗したら
  //    本人はまだログインできるので、もう一度退会すればここからやり直せる。
  const { error: authError } = await adminClient.auth.admin.deleteUser(
    userId,
    true,
  );
  if (authError) {
    return { error: "deleteFailed" };
  }

  return { success: true };
}
