/**
 * SDK に固定する Stripe API のバージョン
 * StripeAPIバージョン
 *
 * SDK の型はこのバージョンの応答形に対応している。SDK を上げるときは
 * `node_modules/stripe/esm/apiVersion.js` の値に合わせて更新する。
 *
 * アプリのクライアント（`stripe.ts`）と `scripts/stripe-bootstrap.ts` が読む。
 * `stripe.ts` は `server-only` を読むため tsx のスクリプトから import できず、
 * 定数だけをこのモジュールに分けている。
 */
export const STRIPE_API_VERSION = "2026-09-30.endive";
