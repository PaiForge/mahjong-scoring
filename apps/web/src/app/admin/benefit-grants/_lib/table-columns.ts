/**
 * 特典の手動付与一覧テーブルの列（左から順）。辞書キー `admin.benefitGrants.table.<key>` と
 * 一致させる
 *
 * 見出し（page.tsx）・「該当なし」行の colSpan・スケルトンの列数（loading.tsx）は
 * すべてこの配列から列数を取る。列を足す・消すときはここだけを直す
 */
export const BENEFIT_GRANT_TABLE_COLUMNS = [
  "target",
  "plan",
  "period",
  "reason",
  "grantedBy",
  "state",
  "actions",
] as const;
