import type { NewPurchase, Purchase } from "@/lib/db";
import {
  addPassDuration,
  PLANS,
  PurchaseKind,
  type OfferDefinition,
} from "@mahjong-scoring/features/billing/plans";
import { PurchaseProvider } from "@mahjong-scoring/features/billing/provider";

import { storePassStartsAt } from "../pass-start";
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
 * - 開始は `storePassStartsAt`（`pass-start.ts`）。期限はパスだけで、開始から数える
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
      ? storePassStartsAt(transaction.purchaseDate, unexpiredPurchases)
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
