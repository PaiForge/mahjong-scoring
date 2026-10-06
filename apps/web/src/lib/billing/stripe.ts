import "server-only";
import Stripe from "stripe";

import { STRIPE_API_VERSION } from "./api-version";
import { getStripeSecretKey } from "./env";

let stripeClient: Stripe | undefined;

/**
 * Stripe クライアント（遅延生成・プロセス内で 1 つ）
 * Stripeクライアント
 *
 * 秘密鍵を読むのは初回の呼び出し時。モジュール読み込み時に読まないのは、
 * Stripe を使わないページのビルドや、環境変数の無いテストで落ちないため。
 */
export function getStripe(): Stripe {
  stripeClient ??= new Stripe(getStripeSecretKey(), {
    apiVersion: STRIPE_API_VERSION,
  });
  return stripeClient;
}
