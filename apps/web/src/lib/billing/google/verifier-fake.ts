import type {
  GooglePurchase,
  GooglePurchaseVerifier,
  GoogleVerification,
} from "./verifier";

/**
 * テスト用の偽の検証器を作る
 * 偽の購入検証器
 *
 * 渡した表に購入トークンと検証の結果を並べておくと、その結果を返す。表に無い
 * トークンは `invalidToken`。Play に問い合わせずに、記録や HTTP の入口を検証の
 * 結果ごとに試すためのもの。テストだけが import する（本番のコードからは
 * import しない）。単体テストと統合テストの両方から使うので、`src/test/` では
 * なく本物の隣に置く（`apple/verifier-fake.ts` と同じ）。
 *
 * @param purchases - 購入トークン → 検証の結果
 */
export function createFakeGooglePurchaseVerifier(
  purchases: ReadonlyMap<string, GoogleVerification<GooglePurchase>>,
): GooglePurchaseVerifier {
  return {
    verifyPurchase: async ({ purchaseToken }) =>
      purchases.get(purchaseToken) ?? { ok: false, reason: "invalidToken" },
  };
}
