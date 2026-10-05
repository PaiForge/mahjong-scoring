/**
 * 特典の手動付与で選べる期間
 * 付与期間
 *
 * 日数の自由入力ではなく少数の選択肢にする（出題設定のバリアントと同じ方針）。
 * キーはフォームの値・辞書キー（`admin.benefitGrants.durations.<key>`）で
 * 同じ文字列を使う。
 */
export const GRANT_DURATION_KEYS = [
  "days30",
  "days90",
  "days180",
  "permanent",
] as const;

const grantDurationKeySet: ReadonlySet<string> = new Set(GRANT_DURATION_KEYS);
export type GrantDurationKey = (typeof GRANT_DURATION_KEYS)[number];

/** 期間ごとの日数。無期限は undefined */
export const GRANT_DURATION_DAYS: Readonly<
  Record<GrantDurationKey, number | undefined>
> = {
  days30: 30,
  days90: 90,
  days180: 180,
  permanent: undefined,
};

/** 文字列が期間のキーか。Server Action がクライアントの入力を絞るのに使う */
export function isGrantDurationKey(value: string): value is GrantDurationKey {
  return grantDurationKeySet.has(value);
}
