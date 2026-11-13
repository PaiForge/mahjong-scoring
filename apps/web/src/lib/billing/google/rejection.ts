import type { PurchaseKind } from "@mahjong-scoring/features/billing/plans";

import { GOOGLE_PLAY_PACKAGE_NAME } from "./env";
import { GoogleEnvironment, type GooglePurchase } from "./verifier";

/**
 * 購入を記録しない理由
 * 記録の拒否理由（Google Play）
 *
 * - `unknownPackage` — 別のアプリの購入
 * - `unknownProduct` — 環境変数の Product ID のどれでもない
 * - `cancelled` — 取り消された購入（Play の `purchaseState` 1）
 * - `pending` — 支払いが保留中（コンビニ払い等。Play の `purchaseState` 2）。
 *   支払いが済めば送り直しで記録できる
 * - `testNotAccepted` — テストの購入（ライセンステスター・開発用のモック）で、
 *   本人が許可リストにいない
 */
export type GoogleRecordRejection =
  | "unknownPackage"
  | "unknownProduct"
  | "cancelled"
  | "pending"
  | "testNotAccepted";

/**
 * DB を見ずに決まる拒否の理由。受け入れるなら undefined
 * 購入の拒否判定（Google Play）
 *
 * 次の規則を **順に** 判定し、最初に当たった理由を返す: パッケージ名が違う →
 * 売り方が引けない → 取り消し済み → 保留中 → テストの購入で本人が許可リストに
 * いない。テストの購入は課金されずに本番サーバーへ届くので、全員に付けると
 * テスト配布を受けた人が全員無料で Pro を得る（App Store の Sandbox と同じ
 * 理由）。許可リストの人の `Test` の行は、特典の判定では `Production` と同じに
 * 扱う。
 *
 * 環境変数は読まず、許可リストは呼び出し側（I/O の境界）が読んで渡す —
 * 判定だけを決定的に確かめられるようにするため（`apple/rejection.ts` と同じ）。
 *
 * @param userId - 記録する本人
 * @param purchase - 検証済みの購入
 * @param kind - 購入の Product ID に対応する売り方。知らない商品なら undefined
 * @param testUserIds - テストの購入を受け入れる user_id（小文字）の集合
 */
export function googleRejectionOf(
  userId: string,
  purchase: GooglePurchase,
  kind: PurchaseKind | undefined,
  testUserIds: ReadonlySet<string>,
): GoogleRecordRejection | undefined {
  if (purchase.packageName !== GOOGLE_PLAY_PACKAGE_NAME)
    return "unknownPackage";
  if (kind === undefined) return "unknownProduct";
  if (purchase.state === "cancelled") return "cancelled";
  if (purchase.state === "pending") return "pending";
  if (
    purchase.environment === GoogleEnvironment.Test &&
    !testUserIds.has(userId.toLowerCase())
  )
    return "testNotAccepted";
  return undefined;
}
