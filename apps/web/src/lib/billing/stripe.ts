import "server-only";
import Stripe from "stripe";

import { getStripeSecretKey } from "./env";

/**
 * SDK に固定する Stripe API のバージョン
 * StripeAPIバージョン
 *
 * SDK の型はこのバージョンの応答形に対応している。SDK を上げるときは
 * `node_modules/stripe/esm/apiVersion.js` の値に合わせて更新する。
 */
const STRIPE_API_VERSION = "2026-09-30.endive";

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
