import { currencyFractionDigits } from "../currency";

/** 通貨コードの形（ISO 4217。DB は小文字で持つ） */
const CURRENCY_PATTERN = /^[a-z]{3}$/;

/** 通貨が無い・形が違うときに入れる通貨（アプリの主な販売地域） */
const FALLBACK_CURRENCY = "jpy";

/**
 * 署名付き取引の価格を、購入行の金額（最小通貨単位）と通貨に直す
 * 金額の換算
 *
 * App Store の `price` は通貨の 1/1000 単位（JPY 980 円は 980000、USD 9.99 は
 * 9990）。購入行の `amount` は Stripe と同じ最小通貨単位（円・セント）なので、
 * 通貨の小数桁（`currencyFractionDigits`。表示側の `formatAmount` と同じ）で
 * 直す。`price` が無ければ 0、通貨が無い・
 * 形が違えば `jpy`。Apple はこの値を収益計算に使わないよう明記しているので、
 * 購入履歴の表示専用で、多少の欠落は受け入れる。
 */
export function appleAmountOf(
  price: number | undefined,
  currency: string | undefined,
): { readonly amount: number; readonly currency: string } {
  const lower = currency?.toLowerCase();
  const normalized =
    lower !== undefined && CURRENCY_PATTERN.test(lower)
      ? lower
      : FALLBACK_CURRENCY;
  if (price === undefined || !Number.isFinite(price) || price < 0)
    return { amount: 0, currency: normalized };
  return {
    amount: Math.round(
      (price / 1000) * 10 ** currencyFractionDigits(normalized),
    ),
    currency: normalized,
  };
}
