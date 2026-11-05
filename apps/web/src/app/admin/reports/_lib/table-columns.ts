/**
 * 通報一覧テーブルの列（左から順）。辞書キー `admin.reports.table.<key>` と一致させる
 *
 * 見出し（page.tsx）・「該当なし」行の colSpan・スケルトンの列数（loading.tsx）は
 * すべてこの配列から列数を取る。列を足す・消すときはここだけを直す
 */
export const REPORT_TABLE_COLUMNS = [
  "createdAt",
  "target",
  "reason",
  "reporter",
  "status",
  "actions",
] as const;
