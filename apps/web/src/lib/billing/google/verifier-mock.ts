import { GOOGLE_MOCK_PURCHASE_TOKEN_PREFIX } from "@mahjong-scoring/features/billing/mobile-api";

import { GOOGLE_PLAY_PACKAGE_NAME } from "./env";
import { GoogleEnvironment, type GooglePurchaseVerifier } from "./verifier";

/** モックの注文 ID に使うトークンの長さ（`google_order_id` の varchar(64) に収める） */
const MOCK_ORDER_ID_TOKEN_LENGTH = 40;

/**
 * 開発用のモックの検証器を作る
 * モック検証器
 *
 * 開発中に実行時に選ぶ検証器。Google に問い合わせない。選ばれる条件は
 * `default-verifier.ts`（`NODE_ENV` が `production` でなく、かつ
 * `GOOGLE_IAP_MOCK_VERIFIER=1`）。
 *
 * 開発ビルドのアプリが本物の Play Billing を通さずに作った購入トークン
 * （`mock:` で始まる）だけを受け、それ以外は `invalidToken`。受けた購入は必ず
 * 支払い済み・環境 `Test` で返すので、記録されるのは許可リスト
 * （`GOOGLE_IAP_TEST_USER_IDS`）の本人だけ。注文 ID は `MOCK.` に接頭辞を除いた
 * トークンの先頭 40 文字を付けたもの。
 *
 * @param now - 購入日時に使う時刻（テストは固定の時刻を渡す）
 */
export function createMockGooglePurchaseVerifier(
  now: () => Date = () => new Date(),
): GooglePurchaseVerifier {
  return {
    verifyPurchase: async ({ productId, purchaseToken }) => {
      if (!purchaseToken.startsWith(GOOGLE_MOCK_PURCHASE_TOKEN_PREFIX))
        return { ok: false, reason: "invalidToken" };
      const body = purchaseToken.slice(
        GOOGLE_MOCK_PURCHASE_TOKEN_PREFIX.length,
      );
      return {
        ok: true,
        value: {
          purchaseToken,
          productId,
          packageName: GOOGLE_PLAY_PACKAGE_NAME,
          orderId: `MOCK.${body.slice(0, MOCK_ORDER_ID_TOKEN_LENGTH)}`,
          purchaseDate: now(),
          state: "purchased",
          environment: GoogleEnvironment.Test,
        },
      };
    },
  };
}
