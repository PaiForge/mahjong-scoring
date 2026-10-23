import { APPLE_APP_BUNDLE_ID } from "@mahjong-scoring/features/account/apple";
import { PurchaseKind } from "@mahjong-scoring/features/billing/plans";

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
 * DB を見ずに決まる拒否の理由。受け入れるなら undefined
 * 取引の拒否判定
 *
 * 判定の順は `recordAppleTransaction` の規則 1・2 のとおり。環境変数は読まず、
 * Sandbox の許可リストは呼び出し側（I/O の境界）が読んで渡す —
 * 判定だけを決定的に確かめられるようにするため。
 *
 * @param userId - 記録する本人
 * @param transaction - 検証済みの取引
 * @param kind - 取引の Product ID に対応する売り方。知らない商品なら undefined
 * @param sandboxUserIds - Sandbox の取引を受け入れる user_id（小文字）の集合
 */
export function rejectionOf(
  userId: string,
  transaction: AppleTransaction,
  kind: PurchaseKind | undefined,
  sandboxUserIds: ReadonlySet<string>,
): AppleRecordRejection | undefined {
  if (transaction.bundleId !== APPLE_APP_BUNDLE_ID) return "unknownBundle";
  if (kind === undefined) return "unknownProduct";
  if (transaction.type !== APPLE_PRODUCT_TYPES[kind]) return "unexpectedType";
  if (transaction.inAppOwnershipType !== PURCHASED_OWNERSHIP)
    return "familyShared";
  if (
    transaction.environment === AppleEnvironment.Sandbox &&
    !sandboxUserIds.has(userId.toLowerCase())
  )
    return "sandboxNotAccepted";
  return undefined;
}
