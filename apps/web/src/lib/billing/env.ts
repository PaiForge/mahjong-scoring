import {
  OFFER_KEYS,
  type OfferKey,
  type PlanKey,
} from "@mahjong-scoring/features/billing/plans";

/**
 * Stripe の環境変数
 * Stripe環境変数
 *
 * `lib/supabase/env.ts` と同じ「無ければ例外」の getter。秘密鍵を
 * `NEXT_PUBLIC_` で公開しないこと。Checkout はリダイレクト方式なので
 * publishable key は使わない。
 *
 * - `STRIPE_SECRET_KEY` — `sk_test_` / `sk_live_`
 * - `STRIPE_WEBHOOK_SECRET` — `whsec_`。ローカルは `stripe listen` が出す値、
 *   本番は Dashboard のエンドポイント詳細の値（別物）
 * - `STRIPE_PRICE_ID_<PLAN>_<OFFER>` — 売り方ごとの Price ID（`price_`）。
 *   テストモードと本番で別の値になる
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

/** Stripe の秘密鍵を取得する。未設定なら例外 */
export function getStripeSecretKey(): string {
  return requireEnv("STRIPE_SECRET_KEY");
}

/** Webhook の署名検証用シークレットを取得する。未設定なら例外 */
export function getStripeWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

/**
 * 売り方ごとの Price ID を持つ環境変数名
 * Price環境変数名
 *
 * 文字列の組み立てではなく表にしているのは、プランや売り方を足したときに
 * ここへの追記をコンパイラに要求させるため。grep でも見つかる。
 */
const OFFER_PRICE_ENV_NAMES: Readonly<
  Record<PlanKey, Readonly<Record<OfferKey, string>>>
> = {
  pro: {
    pass: "STRIPE_PRICE_ID_PRO_PASS",
    lifetime: "STRIPE_PRICE_ID_PRO_LIFETIME",
  },
};

/** 売り方の Price ID を取得する。未設定なら例外 */
export function getOfferPriceId(plan: PlanKey, offer: OfferKey): string {
  return requireEnv(OFFER_PRICE_ENV_NAMES[plan][offer]);
}

/** 売り方の Price ID を取得する。未設定なら undefined */
export function readOfferPriceId(
  plan: PlanKey,
  offer: OfferKey,
): string | undefined {
  return process.env[OFFER_PRICE_ENV_NAMES[plan][offer]] || undefined;
}

/**
 * プランを販売できる状態か（全売り方の Price ID が設定済み）
 * 販売可否
 *
 * 練習の回数制限（`beginPracticeQuestion`）は、これが false の間は掛けない。
 * 制限を掛けると「払いたくても払えないペイウォール」を全員に出すことになる。
 * 回数制限は DB の失敗時も許可して通す設計で、販売できない間に開けておくのも
 * 同じ fail-open の延長。手動付与（`benefit_grants`）で運営者の制限は解けるが、
 * 他の利用者には手段が無い。
 *
 * 裏返すと、本番で Price ID を消すと制限が静かに消える。これは受け入れる —
 * Price ID が無いのは「売っていない」状態そのもので、制限する根拠が無い。
 * 料金ページの購入ボタンはこれを見ていない（Price ID 未設定の Checkout は
 * `checkoutFailed` で止まる）。
 */
export function isPlanOnSale(plan: PlanKey): boolean {
  return OFFER_KEYS.every(
    (offer) => readOfferPriceId(plan, offer) !== undefined,
  );
}
