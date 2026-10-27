/**
 * 通貨の小数桁（JPY は 0、USD は 2）
 * 通貨小数桁
 *
 * 購入行の `amount` は Stripe と同じ最小通貨単位（円・セント）で持つため、
 * 表示（`formatAmount`）は小数桁で割り、App Store の 1/1000 単位の価格
 * （`appleAmountOf`）は小数桁で掛けて最小単位に直す。どちらも同じ
 * `Intl.NumberFormat` の `maximumFractionDigits` を見る。`Intl` が知らない
 * 通貨コードなら 2 桁（ISO 4217 の多数派）。
 *
 * @param currency - ISO 4217 の通貨コード（大文字・小文字どちらでも）
 */
export function currencyFractionDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).resolvedOptions().maximumFractionDigits ?? 0
    );
  } catch {
    return 2;
  }
}
