/**
 * ユーザー一覧テーブルの列（左から順）。辞書キー `admin.usersTable.<key>` と一致させる
 *
 * 見出し（page.tsx）・「該当なし」行の colSpan・スケルトンの列数（loading.tsx）は
 * すべてこの配列から列数を取る。列を足す・消すときはここだけを直す
 */
export const USER_TABLE_COLUMNS = [
  "email",
  "username",
  "displayName",
  "status",
  "plan",
  "loginMethods",
  "createdAt",
  "detail",
] as const;
