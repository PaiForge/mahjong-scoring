/**
 * 購入の決済元
 * 決済元
 *
 * - `stripe` — web の Stripe Checkout（一括払い）
 * - `apple` — iOS アプリの App Store のアプリ内課金
 *
 * 決済元は `purchases.provider` に入り、購入 1 行ごとにどちらか一方を持つ。
 * 決済元ごとに表を分けず 1 表（`purchases`）に持つのは、特典の判定
 * （`has-benefit.ts`）・追加購入の禁止・マイページと管理画面の購入履歴・退会・
 * 期限切れ通知の cron がすべて `purchases` を読んでいるため。2 表にすると
 * 読み手のすべてを UNION に書き換えることになり、決済元を知らなくてよい
 * 特典の判定まで決済元を知る形になる。決済元ごとの列の組み合わせ
 * （Stripe の ID か Apple の取引 ID か）は DB の CHECK が強制する。
 *
 * このモジュールは純粋（React・DB に触れない）で、web とアプリの両方が読む。
 */
export const PurchaseProvider = {
  Stripe: "stripe",
  Apple: "apple",
} as const;
export type PurchaseProvider =
  (typeof PurchaseProvider)[keyof typeof PurchaseProvider];

const PURCHASE_PROVIDER_VALUES: readonly string[] =
  Object.values(PurchaseProvider);

/**
 * 文字列が決済元の値か
 * 決済元判定
 *
 * DB の `purchases.provider` は varchar なので、読むときにここで絞る。
 */
export function isPurchaseProvider(value: string): value is PurchaseProvider {
  return PURCHASE_PROVIDER_VALUES.includes(value);
}
