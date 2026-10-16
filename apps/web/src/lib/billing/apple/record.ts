import { and, desc, eq, inArray } from "drizzle-orm";
import "server-only";

import { APPLE_APP_BUNDLE_ID } from "@mahjong-scoring/features/account/apple";
import { PLANS, PurchaseKind } from "@mahjong-scoring/features/billing/plans";

import {
  appleNotificationEvents,
  db,
  purchases,
  type TransactionClient,
} from "@/lib/db";
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
import { PurchaseRevokeReason } from "../revoke-reason";
import { offerKeyOfAppleProductId, readAppleSandboxUserIds } from "./env";
import { AppleNotificationType } from "./notification-events";
import { buildApplePurchaseRow, type AppleRevocation } from "./purchase-row";
import { lockAppleTransaction } from "./transaction-lock";
import { AppleEnvironment, type AppleTransaction } from "./verifier";

/**
 * 取引を記録しない理由
 * 記録の拒否理由
 *
 * - `unknownBundle` — 別のアプリの取引
 * - `unknownProduct` — 環境変数の Product ID のどれでもない
 * - `unexpectedType` — 商品の種類が売り方と合わない（パスは Consumable、
 *   買い切りは Non-Consumable）
 * - `familyShared` — Family Sharing で共有された取引（両商品とも共有を OFF に
 *   しているので通常は来ない）
 * - `sandboxNotAccepted` — Sandbox の取引で、本人が許可リストにいない
 */
export type AppleRecordRejection =
  | "unknownBundle"
  | "unknownProduct"
  | "unexpectedType"
  | "familyShared"
  | "sandboxNotAccepted";

/**
 * App Store の取引の記録の結果
 * 記録結果
 *
 * - `recorded` — 新しく記録した
 * - `refunded` — 取り消し済み（返金・取り消し）の取引として記録した。購入履歴
 *   にだけ残り、特典は付かない
 * - `duplicate` — 本人の行として記録済み
 * - `ownedByAnotherAccount` — 別のユーザーの行として記録済み
 * - `rejected` — 記録しない取引（{@link AppleRecordRejection}）
 * - `accountUnavailable` — 退会を受け付けたユーザー。何も書いていない
 */
export type AppleRecordResult =
  | { readonly outcome: "recorded" | "refunded"; readonly purchaseId: string }
  | { readonly outcome: "duplicate" }
  | { readonly outcome: "ownedByAnotherAccount" }
  | { readonly outcome: "rejected"; readonly reason: AppleRecordRejection }
  /** 退会を受け付けたユーザー。何も書いていない */
  | { readonly outcome: "accountUnavailable" };

/**
 * 売り方ごとに期待する商品の種類（`AppleTransaction.type`）
 *
 * `Record<PurchaseKind, …>` にして、売り方の種類を足したときにここへの追記を
 * コンパイラに要求させる。
 *
 * @design 30 日パスは消耗型（Consumable）で売る（2026-10）
 *
 * 期間で区切った利用権の本来の種類は Non-Renewing Subscription だが、それだと
 * App Store の購入シートのボタンが「サブスクリプションに登録」になり、自動更新
 * しない売り方の意味が伝わらない（文言は商品の種類で決まり、アプリからは
 * 変えられない）。消耗型ならボタンは「購入」になる。期間はもともとサーバーが
 * 持つ（`buildApplePurchaseRow` が `expiresAt` を決める）ので、種類を変えても特典の
 * 判定は変わらない。違いは 2 つで、どちらも受け入れる:
 *
 * - StoreKit の現在の権利（`Transaction.currentEntitlements`）に消耗型は
 *   載らないので、アプリの「購入を復元」はパスを戻さない。パスはサーバーに
 *   記録済みで、ログインすれば戻る（プラン画面の案内もそう書いている）
 * - 期間で区切った利用権に消耗型を使うと、審査で「IAP の種類が違う」と
 *   差し戻されうる。差し戻されたら、非更新サブスクの旧商品
 *   （`help.mahjong.score.pro.pass30`。消さずに残してある）へ環境変数を
 *   戻し、ここを Non-Renewing Subscription に戻す
 */
const APPLE_PRODUCT_TYPES: Readonly<Record<PurchaseKind, string>> = {
  [PurchaseKind.Pass]: "Consumable",
  [PurchaseKind.Lifetime]: "Non-Consumable",
};

/** 自分の購入として受け入れる所有の種類（Family Sharing の共有ではない） */
const PURCHASED_OWNERSHIP = "PURCHASED";

/**
 * 検証済みの App Store の取引を、ユーザーの購入として記録する
 * 購入記録（App Store）
 *
 * アプリからの送信（購入直後・復元）と ONE_TIME_CHARGE 通知の補完が呼ぶ。
 * 次の規則を **順に** 判定し、最初に当たった結果を返す:
 *
 * 1. 別のアプリ・知らない Product ID・売り方と合わない商品の種類・Family Sharing
 *    の共有は拒否。Family Sharing は両商品とも OFF にしているが、設定の誤りで
 *    共有された取引に特典を付けないよう、サーバーでも弾く
 * 2. Sandbox の取引は、本人が許可リスト（`APPLE_IAP_SANDBOX_USER_IDS`）に
 *    いなければ拒否。TestFlight の購入は課金されずに本番サーバーへ届くため、
 *    全員に付けると配布を受けた人が全員無料で買い切りを得る。許可リストの人の
 *    Sandbox の行は、特典の判定では Production と同じに扱う
 * 3. 取引の advisory lock を取り、退会と直列化する（`lockAccountForWrite`）。
 *    退会を受け付けていたら何も書かない — Stripe には退会で消える顧客行
 *    （`stripe_customers`）があり後着の記録はそこで止まるが、App Store には
 *    それが無く、後から書いた行が消されないまま孤児になる
 * 4. 同じ取引 ID の行が既にあれば、本人なら `duplicate`、他人なら
 *    `ownedByAnotherAccount`。所有者の根拠は行の `user_id` で、`appAccountToken`
 *    は見ない — 退会して再登録した人は user_id が変わり、token を根拠にすると
 *    同じ Apple ID の買い切りを復元できなくなる（退会は行を消すので、再登録後の
 *    復元は新しい行として入る）
 * 5. 取り消し済み（{@link revocationOf}）なら、取り消し済みで記録する
 * 6. パスは、本人に有効か開始待ちの購入があればその期限から始める
 *    （`applePassStartsAt`。重ね買いの救済）
 * 7. INSERT は取引 ID の UNIQUE に `ON CONFLICT DO NOTHING`。行が返らなければ
 *    所有者を読み直して 4 と同じ結果を返す
 *
 * 本人への通知（購入完了、取り消し済みで入れたなら取り消し）はトランザクションの
 * 外で、失敗しても記録を巻き込まずに書く（`notifyQuietly`）。本人の `duplicate`
 * でも保存済みの行から通知を組み直して通す — 初回の通知だけが失敗したとき、
 * アプリの再送・復元・通知が補完の経路になる（Stripe の記録と同じ）。通知側の
 * 一意インデックスで何度通っても 1 通。
 *
 * @param userId - 記録する本人（アプリからは Bearer のユーザー、通知からは
 *   `appAccountToken`）
 * @param transaction - 検証済みの取引
 * @param now - 期限内かを判定する時刻
 */
export async function recordAppleTransaction(
  userId: string,
  transaction: AppleTransaction,
  now: Date = new Date(),
): Promise<AppleRecordResult> {
  const offerKey = offerKeyOfAppleProductId(transaction.productId);
  const offer = offerKey === undefined ? undefined : PLANS.pro.offers[offerKey];
  const rejection = rejectionOf(userId, transaction, offer?.kind);
  if (rejection !== undefined || offer === undefined)
    return { outcome: "rejected", reason: rejection ?? "unknownProduct" };

  // 新しく作った行か、本人の記録済みの行の通知。トランザクションが成功してから書く
  let notification: NotificationInput | undefined;
  const result = await db.transaction(
    async (tx): Promise<AppleRecordResult> => {
      await lockAppleTransaction(tx, transaction.transactionId);
      if (!(await lockAccountForWrite(tx, userId)))
        return { outcome: "accountUnavailable" };

      const existing = await findPurchaseOfTransaction(
        tx,
        transaction.transactionId,
      );
      if (existing) {
        if (existing.userId !== userId)
          return { outcome: "ownedByAnotherAccount" };
        notification = purchaseNotificationOf(existing);
        return { outcome: "duplicate" };
      }

      const revocation = await revocationOf(tx, transaction);
      const row = buildApplePurchaseRow({
        transaction,
        userId,
        offer,
        unexpiredPurchases:
          offer.kind === PurchaseKind.Pass && revocation === undefined
            ? await findUnexpiredPurchases(tx, userId, now)
            : [],
        revocation,
      });
      const [inserted] = await tx
        .insert(purchases)
        .values(row)
        .onConflictDoNothing({ target: purchases.appleTransactionId })
        .returning({ id: purchases.id });
      if (!inserted) {
        const owner = await findPurchaseOfTransaction(
          tx,
          transaction.transactionId,
        );
        if (owner && owner.userId !== userId)
          return { outcome: "ownedByAnotherAccount" };
        if (owner) notification = purchaseNotificationOf(owner);
        return { outcome: "duplicate" };
      }
      notification = purchaseNotificationOf({ ...row, id: inserted.id });
      return {
        outcome: revocation === undefined ? "recorded" : "refunded",
        purchaseId: inserted.id,
      };
    },
  );
  if (notification) await notifyQuietly(notification);
  return result;
}

/**
 * DB を見ずに決まる拒否の理由。受け入れるなら undefined
 *
 * 判定の順は {@link recordAppleTransaction} の規則 1・2 のとおり。
 */
function rejectionOf(
  userId: string,
  transaction: AppleTransaction,
  kind: PurchaseKind | undefined,
): AppleRecordRejection | undefined {
  if (transaction.bundleId !== APPLE_APP_BUNDLE_ID) return "unknownBundle";
  if (kind === undefined) return "unknownProduct";
  if (transaction.type !== APPLE_PRODUCT_TYPES[kind]) return "unexpectedType";
  if (transaction.inAppOwnershipType !== PURCHASED_OWNERSHIP)
    return "familyShared";
  if (
    transaction.environment === AppleEnvironment.Sandbox &&
    !readAppleSandboxUserIds().has(userId.toLowerCase())
  )
    return "sandboxNotAccepted";
  return undefined;
}

/** 取引 ID の購入行（通知を組む列）を読む */
async function findPurchaseOfTransaction(
  tx: TransactionClient,
  transactionId: string,
) {
  const [row] = await tx
    .select(PURCHASE_NOTIFICATION_COLUMNS)
    .from(purchases)
    .where(eq(purchases.appleTransactionId, transactionId))
    .limit(1);
  return row;
}

/**
 * 記録の時点でこの取引が取り消し済みか。取り消し済みならその日時と理由
 * 記録時の取り消し判定
 *
 * - 署名付き取引に `revocationDate` がある → その日時で `refunded`
 * - 通知の記録表（`apple_notification_events`）にこの取引の REFUND / REVOKE /
 *   REFUND_REVERSED があり、最新が REFUND なら `refunded`、REVOKE なら `revoked`
 *   （日時はその通知の署名日時）。最新が REFUND_REVERSED なら取り消されていない
 *
 * 「最新」は Apple が通知に署名した日時（`signed_date`）で決める。受信の順は
 * Apple の再送で入れ替わる — REFUND の配達に失敗して再送を待つ間に
 * REFUND_REVERSED が先に届くと、受信順では返金が後に見えて逆の結果になる。
 *
 * 2 つ目は、返金の通知が購入の記録より先に届いたとき（アプリが送る前に返金
 * された等）の備え。取り消し（`revoke.ts`）は取り消す行が無くても取引 ID 付きで
 * 通知を記録しておき、後から来た記録がここで拾う。App Store Server API で取引の
 * 現在の状態を問い合わせない代わりで、記録表がその役を担う。
 *
 * 呼び出し側が取引の advisory lock を持った状態で読む。取り消し側も同じロックの
 * 下で記録表に書くので、ここで読んだ結果は確定している（ロックを外した後に
 * 取り消しの通知が書き足され、この記録が見落とすことはない）。
 */
async function revocationOf(
  tx: TransactionClient,
  transaction: AppleTransaction,
): Promise<AppleRevocation | undefined> {
  if (transaction.revocationDate !== undefined)
    return {
      at: transaction.revocationDate,
      reason: PurchaseRevokeReason.Refunded,
    };
  const [latest] = await tx
    .select({
      type: appleNotificationEvents.notificationType,
      signedDate: appleNotificationEvents.signedDate,
    })
    .from(appleNotificationEvents)
    .where(
      and(
        eq(
          appleNotificationEvents.appleTransactionId,
          transaction.transactionId,
        ),
        inArray(appleNotificationEvents.notificationType, [
          AppleNotificationType.Refund,
          AppleNotificationType.Revoke,
          AppleNotificationType.RefundReversed,
        ]),
      ),
    )
    .orderBy(desc(appleNotificationEvents.signedDate))
    .limit(1);
  if (latest?.type === AppleNotificationType.Refund)
    return { at: latest.signedDate, reason: PurchaseRevokeReason.Refunded };
  if (latest?.type === AppleNotificationType.Revoke)
    return { at: latest.signedDate, reason: PurchaseRevokeReason.Revoked };
  return undefined;
}
