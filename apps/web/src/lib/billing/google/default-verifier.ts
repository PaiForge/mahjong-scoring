import "server-only";

import { isGoogleMockVerifierEnabled } from "./env";
import { createMockGooglePurchaseVerifier } from "./verifier-mock";
import type { GooglePurchaseVerifier } from "./verifier";

/** 作ったモックの検証器（モジュールの中で 1 つを使い回す） */
let mockVerifier: GooglePurchaseVerifier | undefined;

/**
 * 購入の記録の API が使う検証器を返す。使える検証器が無ければ undefined
 * 既定の購入検証器（Google Play）
 *
 * 本物の検証器（Play Developer API に問い合わせるもの）はまだ無い。いま返す
 * ことがあるのは開発用のモックだけで、それ以外は undefined。呼び出し側は
 * 「確かめられない」として 503 `storeUnavailable` を返す（アプリは購入を
 * 完了せず、後で送り直す）。
 *
 * @design モックは `NODE_ENV !== "production"` かつ `GOOGLE_IAP_MOCK_VERIFIER=1` のときだけ選ぶ
 *
 * 条件は `isGoogleMockVerifierEnabled`。Vercel のビルドは Preview も本番も
 * `NODE_ENV=production` で動くので、フラグを本番に誤って設定してもモックは
 * 選ばれない（`VERCEL_ENV` はシステム環境変数を公開する設定に依って値が無い
 * こともあるので根拠にしない）。Apple の偽の検証器のように「本番のモジュール
 * グラフから import しない」ことで守る形は使えない — 開発中に実行時に選ぶ
 * 必要があるので、この条件で守る。
 *
 * 条件をすり抜けた場合の 2 段目の守りとして、モックは `mock:` で始まる
 * トークンだけを受け、購入を必ず環境 `Test` で返す。`Test` の購入は許可リスト
 * （`GOOGLE_IAP_TEST_USER_IDS`）の本人にしか記録しない。この許可リストは本物の
 * ライセンステスターの購入（`purchaseType = 0`）にもそのまま要る規則で、モック
 * 専用ではない（`APPLE_IAP_SANDBOX_USER_IDS` と同じ理由 — 課金されない購入に
 * 全員へ特典を付けると、テスト配布を受けた人が全員無料で Pro を得る）。
 */
export function getGooglePurchaseVerifier():
  GooglePurchaseVerifier | undefined {
  if (!isGoogleMockVerifierEnabled()) return undefined;
  mockVerifier ??= createMockGooglePurchaseVerifier();
  return mockVerifier;
}
