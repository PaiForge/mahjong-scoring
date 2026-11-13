import { eq } from "drizzle-orm";
import "server-only";

import { PLANS, PurchaseKind } from "@mahjong-scoring/features/billing/plans";

import { db, purchases, type TransactionClient } from "@/lib/db";
import {
  notifyQuietly,
  type NotificationInput,
} from "@/lib/notifications/create-notification";
import { lockAccountForWrite } from "@/lib/users/account-write-lock";

import { findUnexpiredPurchases } from "../checkout-state";
import {
  PURCHASE_NOTIFICATION_COLUMNS,
  purchaseNotificationOf,
} from "../purchases";
import { offerKeyOfGoogleProductId, readGoogleTestUserIds } from "./env";
import { lockGooglePurchase } from "./purchase-lock";
import { buildGooglePurchaseRow } from "./purchase-row";
import { googleRejectionOf, type GoogleRecordRejection } from "./rejection";
import type { GooglePurchase } from "./verifier";

/**
 * Google Play の購入の記録の結果
 * 記録結果（Google Play）
 *
 * - `recorded` — 新しく記録した
 * - `duplicate` — 本人の行として記録済み
 * - `ownedByAnotherAccount` — 別のユーザーの行として記録済み
 * - `rejected` — 記録しない購入（{@link GoogleRecordRejection}）
 * - `accountUnavailable` — 退会を受け付けたユーザー。何も書いていない
 *
 * App Store の記録（`AppleRecordResult`）にある `refunded` は無い — 返金の
 * 取り込みを持たないため（{@link recordGooglePurchase}）。
 */
export type GoogleRecordResult =
  | { readonly outcome: "recorded"; readonly purchaseId: string }
  | { readonly outcome: "duplicate" }
  | { readonly outcome: "ownedByAnotherAccount" }
  | { readonly outcome: "rejected"; readonly reason: GoogleRecordRejection }
  /** 退会を受け付けたユーザー。何も書いていない */
  | { readonly outcome: "accountUnavailable" };

/**
 * 検証済みの Google Play の購入を、ユーザーの購入として記録する
 * 購入記録（Google Play）
 *
 * アプリからの送信（購入直後・起動時の送り直し）が呼ぶ。App Store の記録
 * （`recordAppleTransaction`）と同じ順に、次の規則を **順に** 判定し、最初に
 * 当たった結果を返す:
 *
 * 1. DB を見ずに決まる拒否（`googleRejectionOf`。別のアプリ・知らない
 *    Product ID・取り消し済み・保留中・許可リストにいない人のテストの購入）
 * 2. 購入トークンの advisory lock を取り、退会と直列化する
 *    （`lockAccountForWrite`）。退会を受け付けていたら何も書かない —
 *    後から書いた行が消されないまま孤児になる
 * 3. 同じ購入トークンの行が既にあれば、本人なら `duplicate`、他人なら
 *    `ownedByAnotherAccount`。所有者の根拠は行の `user_id`
 * 4. パスは、本人に有効か開始待ちの購入があればその期限から始める
 *    （`storePassStartsAt`。重ね買いの救済）
 * 5. INSERT は購入トークンの UNIQUE に `ON CONFLICT DO NOTHING`。行が返らなければ
 *    所有者を読み直して 3 と同じ結果を返す
 *
 * 本人への購入完了の通知はトランザクションの外で、失敗しても記録を巻き込まずに
 * 書く（`notifyQuietly`）。本人の `duplicate` でも保存済みの行から通知を組み直して
 * 通す — 初回の通知だけが失敗したとき、アプリの送り直しが補完の経路になる。
 * 通知側の一意インデックスで何度通っても 1 通。
 *
 * @design 返金の取り込みは未実装
 *
 * 取り消し（返金）の判定を持たない。Play の返金の取り込み（Real-time developer
 * notifications・Voided Purchases API）は未実装で、記録した後に返金された購入の
 * 特典は止まらない。本物の検証器（Play Developer API への問い合わせ）と一緒に
 * 足す — Play の商品登録が無いと実物で確かめられないため、いまは書かない。
 *
 * @param userId - 記録する本人（アプリの Bearer のユーザー）
 * @param purchase - 検証済みの購入
 * @param now - 期限内かを判定する時刻
 */
export async function recordGooglePurchase(
  userId: string,
  purchase: GooglePurchase,
  now: Date = new Date(),
): Promise<GoogleRecordResult> {
  const offerKey = offerKeyOfGoogleProductId(purchase.productId);
  const offer = offerKey === undefined ? undefined : PLANS.pro.offers[offerKey];
  const rejection = googleRejectionOf(
    userId,
    purchase,
    offer?.kind,
    readGoogleTestUserIds(),
  );
  if (rejection !== undefined || offer === undefined)
    return { outcome: "rejected", reason: rejection ?? "unknownProduct" };

  // 新しく作った行か、本人の記録済みの行の通知。トランザクションが成功してから書く
  let notification: NotificationInput | undefined;
  const result = await db.transaction(
    async (tx): Promise<GoogleRecordResult> => {
      await lockGooglePurchase(tx, purchase.purchaseToken);
      if (!(await lockAccountForWrite(tx, userId)))
        return { outcome: "accountUnavailable" };

      const existing = await findPurchaseOfToken(tx, purchase.purchaseToken);
      if (existing) {
        if (existing.userId !== userId)
          return { outcome: "ownedByAnotherAccount" };
        notification = purchaseNotificationOf(existing);
        return { outcome: "duplicate" };
      }

      const row = buildGooglePurchaseRow({
        purchase,
        userId,
        offer,
        unexpiredPurchases:
          offer.kind === PurchaseKind.Pass
            ? await findUnexpiredPurchases(tx, userId, now)
            : [],
      });
      const [inserted] = await tx
        .insert(purchases)
        .values(row)
        .onConflictDoNothing({ target: purchases.googlePurchaseToken })
        .returning({ id: purchases.id });
      if (!inserted) {
        const owner = await findPurchaseOfToken(tx, purchase.purchaseToken);
        if (owner && owner.userId !== userId)
          return { outcome: "ownedByAnotherAccount" };
        if (owner) notification = purchaseNotificationOf(owner);
        return { outcome: "duplicate" };
      }
      notification = purchaseNotificationOf({
        ...row,
        id: inserted.id,
        revokedAt: null,
        revokeReason: null,
      });
      return { outcome: "recorded", purchaseId: inserted.id };
    },
  );
  if (notification) await notifyQuietly(notification);
  return result;
}

/** 購入トークンの購入行（通知を組む列）を読む */
async function findPurchaseOfToken(
  tx: TransactionClient,
  purchaseToken: string,
) {
  const [row] = await tx
    .select(PURCHASE_NOTIFICATION_COLUMNS)
    .from(purchases)
    .where(eq(purchases.googlePurchaseToken, purchaseToken))
    .limit(1);
  return row;
}
