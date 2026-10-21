import type { NewPurchase, Purchase } from "@/lib/db";
import {
  addPassDuration,
  PLANS,
  PurchaseKind,
  type OfferDefinition,
} from "@mahjong-scoring/features/billing/plans";
import { PurchaseProvider } from "@mahjong-scoring/features/billing/provider";

import type { PurchaseRevokeReason } from "../revoke-reason";
import { appleAmountOf } from "./amount";
import type { AppleTransaction } from "./verifier";

/**
 * 記録の時点で取り消し済みと分かっている取引の、取り消しの日時と理由
 * 記録時の取り消し
 */
export interface AppleRevocation {
  readonly at: Date;
  readonly reason:
    typeof PurchaseRevokeReason.Refunded | typeof PurchaseRevokeReason.Revoked;
}

/**
 * App Store の取引から購入の行を組み立てる
 * 購入行の組み立て（App Store）
 *
 * - プラン・特典は記録した時点の `PLANS.pro`。web は購入手続きの開始時に
 *   特典を固定する（`billing_checkouts`）が、App Store には手続きの行が無い。
 *   記録が遅れた分だけ新しい特典が付く方向にしか動かないので受け入れる
 * - 開始は {@link applePassStartsAt}。期限はパスだけで、開始から数える
 * - 取り消し済みと分かっている取引（`revocation`）は取り消し済みで入れる。
 *   購入履歴には「返金済み」として残る
 *
 * @param transaction - 検証済みの取引
 * @param userId - 購入した本人
 * @param offer - Product ID から引いた売り方
 * @param unexpiredPurchases - 本人の未取消・期限内か永久の購入（Sandbox を除く）。
 *   パスの開始日を決めるのに使う
 * @param revocation - 記録の時点で取り消し済みなら、その日時と理由
 */
export function buildApplePurchaseRow({
  transaction,
  userId,
  offer,
  unexpiredPurchases,
  revocation,
}: {
  readonly transaction: Pick<
    AppleTransaction,
    | "transactionId"
    | "originalTransactionId"
    | "productId"
    | "environment"
    | "purchaseDate"
    | "price"
    | "currency"
  >;
  readonly userId: string;
  readonly offer: OfferDefinition;
  readonly unexpiredPurchases: readonly Pick<Purchase, "expiresAt">[];
  readonly revocation: AppleRevocation | undefined;
}): NewPurchase &
  Pick<Purchase, "startsAt" | "expiresAt" | "revokedAt" | "revokeReason"> {
  const startsAt =
    offer.kind === PurchaseKind.Pass && revocation === undefined
      ? applePassStartsAt(transaction.purchaseDate, unexpiredPurchases)
      : transaction.purchaseDate;
  const { amount, currency } = appleAmountOf(
    transaction.price,
    transaction.currency,
  );
  return {
    userId,
    provider: PurchaseProvider.Apple,
    plan: PLANS.pro.key,
    kind: offer.kind,
    benefits: [...PLANS.pro.benefits],
    appleTransactionId: transaction.transactionId,
    appleOriginalTransactionId: transaction.originalTransactionId,
    appleProductId: transaction.productId,
    appleEnvironment: transaction.environment,
    currency,
    amount,
    startsAt,
    expiresAt:
      offer.kind === PurchaseKind.Pass
        ? addPassDuration(startsAt, offer.durationDays)
        : null,
    revokedAt: revocation?.at ?? null,
    revokeReason: revocation?.reason ?? null,
  };
}

/**
 * App Store から届いたパスの開始日時を決める
 * パスの開始日時
 *
 * 原則は購入日時。ただし本人に有効か開始待ちの購入があり、それが期限を
 * 持つなら、その中で最も遅い期限から始める（開始待ちで入れる）。
 *
 * 重ね買いはアプリの画面で止めている（有効な購入があれば購入ボタンを出さない）
 * が、すり抜けた 2 枚目のパスもここで繋ぐ。web は重なった決済を自動で返金して
 * 救うが、App Store には開発者から返金する手段が無く、本人の払った分を
 * 無駄にしないためには後ろに繋ぐしかない。
 *
 * 買い切り（期限なし）が有効なら購入日時から始める。パスの日数は買い切りに
 * 埋もれて無駄になるが、買い切りの方が常に強いので本人の特典は減らない
 * （画面がボタンを隠すので通常は起きない）。
 *
 * @param purchaseDate - 取引の購入日時
 * @param unexpiredPurchases - 本人の未取消・期限内か永久の購入（Sandbox を除く）
 */
function applePassStartsAt(
  purchaseDate: Date,
  unexpiredPurchases: readonly Pick<Purchase, "expiresAt">[],
): Date {
  let latest = purchaseDate;
  for (const purchase of unexpiredPurchases) {
    if (purchase.expiresAt === null) return purchaseDate;
    if (purchase.expiresAt > latest) latest = purchase.expiresAt;
  }
  return latest;
}
