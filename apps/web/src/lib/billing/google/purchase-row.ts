import type { NewPurchase, Purchase } from "@/lib/db";
import {
  addPassDuration,
  PLANS,
  PurchaseKind,
  type OfferDefinition,
} from "@mahjong-scoring/features/billing/plans";
import { PurchaseProvider } from "@mahjong-scoring/features/billing/provider";

import { storePassStartsAt } from "../pass-start";
import type { GooglePurchase } from "./verifier";

/**
 * Google Play の購入から購入の行を組み立てる
 * 購入行の組み立て（Google Play）
 *
 * - プラン・特典は記録した時点の `PLANS.pro`（App Store と同じく、手続きの行が
 *   無いため。記録が遅れた分だけ新しい特典が付く方向にしか動かない）
 * - 開始は、パスなら `storePassStartsAt`（重ね買いの救済。App Store と同じ規則）、
 *   買い切りなら購入日時。期限はパスだけで、開始から数える
 * - 注文 ID はプロモコードでの引き換え等で欠けうるので、無ければ NULL
 *
 * @design 金額は 0 / `jpy` で持ち、画面は Google の行の金額を出さない
 *
 * Play Developer API の購入の取得（`purchases.products.get`）は価格を返さない
 * （API の文書からの理解で、実物では未確認）。`purchases.amount` は表示専用の
 * 値で、特典の判定にも会計にも使わないので、列の NOT NULL を満たすだけの 0 で
 * 持つ。マイページと管理画面は Google の行の金額を「—」にして、0 円と見せない。
 *
 * @param purchase - 検証済みの購入
 * @param userId - 購入した本人
 * @param offer - Product ID から引いた売り方
 * @param unexpiredPurchases - 本人の未取消・期限内か永久の購入（Sandbox / Test を
 *   除く）。パスの開始日を決めるのに使う
 */
export function buildGooglePurchaseRow({
  purchase,
  userId,
  offer,
  unexpiredPurchases,
}: {
  readonly purchase: Pick<
    GooglePurchase,
    "purchaseToken" | "orderId" | "productId" | "environment" | "purchaseDate"
  >;
  readonly userId: string;
  readonly offer: OfferDefinition;
  readonly unexpiredPurchases: readonly Pick<Purchase, "expiresAt">[];
}): NewPurchase & Pick<Purchase, "startsAt" | "expiresAt"> {
  const startsAt =
    offer.kind === PurchaseKind.Pass
      ? storePassStartsAt(purchase.purchaseDate, unexpiredPurchases)
      : purchase.purchaseDate;
  return {
    userId,
    provider: PurchaseProvider.Google,
    plan: PLANS.pro.key,
    kind: offer.kind,
    benefits: [...PLANS.pro.benefits],
    googlePurchaseToken: purchase.purchaseToken,
    googleOrderId: purchase.orderId ?? null,
    googleProductId: purchase.productId,
    googleEnvironment: purchase.environment,
    currency: "jpy",
    amount: 0,
    startsAt,
    expiresAt:
      offer.kind === PurchaseKind.Pass
        ? addPassDuration(startsAt, offer.durationDays)
        : null,
  };
}
