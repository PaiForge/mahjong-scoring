import {
  OFFER_KEYS,
  type OfferKey,
  type PlanKey,
} from "@mahjong-scoring/features/billing/plans";

/**
 * App Store のアプリ内課金の環境変数
 * アプリ内課金環境変数
 *
 * `lib/billing/env.ts` の reader と同じ「無ければ undefined」の形。どれも
 * 秘密ではないが、Product ID と App ID は App Store Connect の設定に依るので
 * コードに書かない。
 *
 * - `APPLE_IAP_PRODUCT_ID_<PLAN>_<OFFER>` — 売り方ごとの Product ID
 * - `APPLE_IAP_APP_APPLE_ID` — App Store Connect の数値の App ID（`eas.json` の
 *   `ascAppId` と同じ値）。Production の署名付きデータの検証に要る
 * - `APPLE_IAP_SANDBOX_USER_IDS` — Sandbox の取引に特典を付けてよい user_id
 *   （カンマ区切りの UUID）。許可リスト
 */

/**
 * 売り方ごとの Product ID を持つ環境変数名
 * Product ID環境変数名
 *
 * `OFFER_PRICE_ENV_NAMES`（Stripe）と同じく表にして、プランや売り方を
 * 足したときにここへの追記をコンパイラに要求させる。
 */
const APPLE_PRODUCT_ID_ENV_NAMES: Readonly<
  Record<PlanKey, Readonly<Record<OfferKey, string>>>
> = {
  pro: {
    pass: "APPLE_IAP_PRODUCT_ID_PRO_PASS",
    lifetime: "APPLE_IAP_PRODUCT_ID_PRO_LIFETIME",
  },
};

/**
 * アプリで売る売り方とその Product ID を読む。買い切りが無ければ undefined
 * Product ID取得
 *
 * 買い切りは必須、30 日パスは任意。パスの Product ID を外すと、アプリには
 * 買い切りだけが並ぶ（web の Stripe のパスはそのまま売る）。パスの商品の
 * 種類（消耗型）とその理由は `rejection.ts` の `APPLE_PRODUCT_TYPES`。
 */
export function readAppleProductIds():
  Readonly<Partial<Record<OfferKey, string>>> | undefined {
  const pass = process.env[APPLE_PRODUCT_ID_ENV_NAMES.pro.pass];
  const lifetime = process.env[APPLE_PRODUCT_ID_ENV_NAMES.pro.lifetime];
  if (!lifetime) return undefined;
  return pass ? { pass, lifetime } : { lifetime };
}

/**
 * アプリで Pro を販売できる状態か（買い切りの Product ID が設定済み）
 * アプリ内課金の販売可否
 *
 * web の `isPlanOnSale`（Stripe の Price ID の有無）とは独立に、経路ごとに
 * 判定する。web で売っていてもアプリで売っていなければアプリの回数制限は
 * 掛けない（払いたくても払えないペイウォールを出さない）し、逆も同じ。
 * 一方の経路だけで売っている期間は、同じアカウントの扱いが web とアプリで割れるが、
 * それは受け入れる — 「その経路で買えるか」が制限を掛ける根拠だから。
 */
export function isAppleIapOnSale(): boolean {
  return readAppleProductIds() !== undefined;
}

/**
 * Product ID から売り方を引く。知らない Product ID なら undefined
 * 売り方の逆引き
 */
export function offerKeyOfAppleProductId(
  productId: string,
): OfferKey | undefined {
  const ids = readAppleProductIds();
  if (!ids) return undefined;
  return OFFER_KEYS.find((offer) => ids[offer] === productId);
}

/**
 * App Store Connect の数値の App ID を読む。無い・数でなければ undefined
 * App ID取得
 *
 * Production の検証器が通知の `appAppleId` との一致を確かめるのに使う。
 * 無ければ検証器を作れないので、呼び出し側は「検証できない」として応答する。
 */
export function readAppleAppId(): number | undefined {
  const value = process.env.APPLE_IAP_APP_APPLE_ID;
  if (!value || !/^\d+$/.test(value)) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : undefined;
}

/**
 * Sandbox の取引に特典を付けてよい user_id の集合を読む
 * 許可リスト取得
 *
 * TestFlight・審査の購入は課金されずに本番サーバーへ届く。全員に特典を
 * 付けると、TestFlight の配布を受けた人が全員無料で買い切りを得るので、
 * 審査用のデモアカウントと運営のテスターだけをここに載せる。未設定・空なら
 * 空集合（Sandbox の取引は誰にも記録しない）。
 */
export function readAppleSandboxUserIds(): ReadonlySet<string> {
  const value = process.env.APPLE_IAP_SANDBOX_USER_IDS ?? "";
  return new Set(
    value
      .split(",")
      .map((id) => id.trim().toLowerCase())
      .filter((id) => id.length > 0),
  );
}
